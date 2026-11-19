import "server-only";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { SwipeDirection } from "@/lib/types";

export type SwipeRecord = {
  profileId: string;
  direction: SwipeDirection;
  createdAt: string; // ISO
};

export type MatchRecord = {
  profileId: string;
  matchedAt: string; // ISO
};

export type DbState = {
  swipes: Record<string, SwipeRecord>; // keyed by profileId: one swipe per profile
  matches: MatchRecord[];
};

const STATE_FILE = "state.json";

// Dev servers can load this module once per route bundle, so the mutex and the
// resolved directory live on globalThis to be shared by every route handler.
type DbGlobal = {
  chain: Promise<unknown>;
  dir?: { key: string; path: string };
};
const globalForDb = globalThis as typeof globalThis & { __coyDb?: DbGlobal };
const shared: DbGlobal = (globalForDb.__coyDb ??= { chain: Promise.resolve() });

const emptyState = (): DbState => ({ swipes: {}, matches: [] });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const errorCode = (err: unknown): string | undefined =>
  isRecord(err) && typeof err.code === "string" ? err.code : undefined;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tmpFallbackDir = () => path.join(os.tmpdir(), "coy-discover");

/**
 * Where state.json lives: $DATA_DIR, else ./data. If that directory is not
 * writable (read-only hosts such as Vercel) we fall back to the OS temp dir,
 * where state is ephemeral.
 */
async function resolveDataDir(): Promise<string> {
  const key = process.env.DATA_DIR ?? "";
  if (shared.dir && shared.dir.key === key) return shared.dir.path;

  // The state directory is runtime configuration, not a build-time dependency. The
  // turbopackIgnore comments stop Turbopack from tracing the whole project into the
  // server output because of this dynamic path.
  const preferred = key
    ? path.resolve(/* turbopackIgnore: true */ key)
    : path.join(/* turbopackIgnore: true */ process.cwd(), "data");
  let chosen = preferred;
  try {
    await fs.mkdir(preferred, { recursive: true });
    await fs.access(preferred, fsConstants.W_OK);
  } catch {
    chosen = tmpFallbackDir();
    await fs.mkdir(chosen, { recursive: true });
  }
  shared.dir = { key, path: chosen };
  return chosen;
}

async function loadState(): Promise<DbState> {
  const file = path.join(await resolveDataDir(), STATE_FILE);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (err) {
    if (errorCode(err) === "ENOENT") return emptyState();
    throw err;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && isRecord(parsed.swipes) && Array.isArray(parsed.matches)) {
      return { swipes: parsed.swipes as DbState["swipes"], matches: parsed.matches as MatchRecord[] };
    }
  } catch {
    // Corrupt file: fall through and start from a clean demo state.
  }
  return emptyState();
}

/** Write to a temp file in the same directory, then rename over state.json. */
async function writeAtomic(dir: string, state: DbState): Promise<void> {
  const file = path.join(dir, STATE_FILE);
  const tmp = path.join(dir, `.state.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
  try {
    await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    for (let attempt = 0; ; attempt++) {
      try {
        await fs.rename(tmp, file);
        return;
      } catch (err) {
        // Windows can briefly refuse to replace a file another handle has open.
        const code = errorCode(err);
        if (attempt < 4 && (code === "EPERM" || code === "EBUSY" || code === "EACCES")) {
          await sleep(20 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => undefined);
    throw err;
  }
}

async function saveState(state: DbState): Promise<void> {
  const dir = await resolveDataDir();
  try {
    await writeAtomic(dir, state);
  } catch (err) {
    const code = errorCode(err);
    const readOnly = code === "EROFS" || code === "EACCES" || code === "EPERM";
    if (!readOnly || dir === tmpFallbackDir()) throw err;
    // Read-only filesystem discovered at write time: switch to the temp dir.
    const fallback = tmpFallbackDir();
    await fs.mkdir(fallback, { recursive: true });
    shared.dir = { key: process.env.DATA_DIR ?? "", path: fallback };
    await writeAtomic(fallback, state);
  }
}

/**
 * Run `fn` against the current state while holding the process-wide lock
 * (a simple promise chain), so rapid swipes can never interleave. If `fn`
 * changed the state it is written back atomically.
 */
export function transact<T>(fn: (state: DbState) => T | Promise<T>): Promise<T> {
  const run = shared.chain.then(async () => {
    const state = await loadState();
    const before = JSON.stringify(state);
    const result = await fn(state);
    if (JSON.stringify(state) !== before) await saveState(state);
    return result;
  });
  shared.chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Read-only snapshot of the state (still goes through the lock). */
export function readState(): Promise<DbState> {
  return transact((state) => state);
}

/** Demo helper: delete state.json so the demo starts from scratch. */
export function resetState(): Promise<void> {
  const run = shared.chain.then(async () => {
    const file = path.join(await resolveDataDir(), STATE_FILE);
    await fs.rm(file, { force: true });
  });
  shared.chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
