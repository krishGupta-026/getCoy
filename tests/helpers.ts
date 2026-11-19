import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach } from "vitest";
import seed from "@/data/profiles.json";

export const LIKED_ME = seed.filter((p) => p.likedMe).map((p) => p.id);
export const NOT_LIKED_ME = seed.filter((p) => !p.likedMe).map((p) => p.id);

/** Gives every test its own empty state directory (state.json lives in DATA_DIR). */
export function withTempDataDir() {
  let dir = "";
  const previous = process.env.DATA_DIR;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "coy-test-"));
    process.env.DATA_DIR = dir;
  });
  afterEach(async () => {
    if (previous === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previous;
    await fs.rm(dir, { recursive: true, force: true });
  });
  return () => dir;
}

export const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
