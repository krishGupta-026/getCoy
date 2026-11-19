import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as feedRoute from "@/app/api/feed/route";
import * as matchesRoute from "@/app/api/matches/route";
import * as resetRoute from "@/app/api/reset/route";
import * as swipeRoute from "@/app/api/swipe/route";
import nextConfig from "@/next.config";
import { readState } from "@/lib/server/db";
import { LIKED_ME, NOT_LIKED_ME, post, withTempDataDir } from "./helpers";

const dataDir = withTempDataDir();

afterEach(() => vi.unstubAllEnvs());

const feed = (query = "") => feedRoute.GET(new Request(`http://localhost/api/feed${query}`));
const swipe = (body: unknown) => swipeRoute.POST(post("/api/swipe", body));

describe("route handlers", () => {
  it("every handler opts out of caching with force-dynamic", () => {
    for (const route of [feedRoute, swipeRoute, matchesRoute, resetRoute]) {
      expect(route.dynamic).toBe("force-dynamic");
    }
  });

  it("GET /api/feed: default 10, ?limit honoured, never cached", async () => {
    const res = await feed();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await res.json()).profiles).toHaveLength(10);
    expect((await (await feed("?limit=3")).json()).profiles).toHaveLength(3);
    expect((await (await feed("?limit=abc")).json()).profiles).toHaveLength(10);
    expect((await (await feed("?limit=500")).json()).profiles).toHaveLength(20);
  });

  it("POST /api/swipe: 400 invalid_body for bad JSON, missing fields and bad direction", async () => {
    const bad: unknown[] = [
      "not json",
      "",
      "null",
      "[]",
      {},
      { profileId: LIKED_ME[0] },
      { direction: "like" },
      { profileId: LIKED_ME[0], direction: "love" },
    ];
    for (const body of bad) {
      const res = await swipe(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_body" });
    }
    expect((await readState()).swipes).toEqual({});
  });

  it("POST /api/swipe: 404 profile_not_found for unknown ids", async () => {
    const res = await swipe({ profileId: "p99", direction: "like" });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "profile_not_found" });
  });

  it("POST /api/swipe: match, non-match and idempotent repeat", async () => {
    const match = await (await swipe({ profileId: LIKED_ME[0], direction: "like" })).json();
    expect(match.matched).toBe(true);
    expect(match.match.id).toBe(LIKED_ME[0]);

    const none = await (await swipe({ profileId: NOT_LIKED_ME[0], direction: "like" })).json();
    expect(none).toEqual({ matched: false });

    const repeat = await (await swipe({ profileId: LIKED_ME[0], direction: "like" })).json();
    expect(repeat).toEqual({ ...match, alreadySwiped: true });
  });

  it("GET /api/matches: only mutual matches, newest first", async () => {
    expect(await (await matchesRoute.GET()).json()).toEqual({ matches: [] });

    await swipe({ profileId: LIKED_ME[0], direction: "like" });
    await swipe({ profileId: NOT_LIKED_ME[0], direction: "like" });
    await new Promise((r) => setTimeout(r, 5));
    await swipe({ profileId: LIKED_ME[1], direction: "like" });
    await swipe({ profileId: LIKED_ME[2], direction: "pass" });

    const { matches } = await (await matchesRoute.GET()).json();
    expect(matches.map((m: { profile: { id: string } }) => m.profile.id)).toEqual([LIKED_ME[1], LIKED_ME[0]]);
  });

  it("POST /api/reset: clears the demo outside production", async () => {
    await swipe({ profileId: LIKED_ME[0], direction: "like" });
    const res = await resetRoute.POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect((await readState()).swipes).toEqual({});
    await expect(fs.access(path.join(dataDir(), "state.json"))).rejects.toThrow();
    expect((await resetRoute.POST()).status).toBe(200); // resetting an empty demo is fine
  });

  it("POST /api/reset: 403 in production unless ALLOW_RESET=true", async () => {
    await swipe({ profileId: LIKED_ME[0], direction: "like" });
    vi.stubEnv("NODE_ENV", "production");

    const blocked = await resetRoute.POST();
    expect(blocked.status).toBe(403);
    expect((await readState()).matches).toHaveLength(1); // nothing was deleted

    vi.stubEnv("ALLOW_RESET", "true");
    expect((await resetRoute.POST()).status).toBe(200);
    expect((await readState()).matches).toHaveLength(0);
  });
});

describe("persistence (state.json)", () => {
  it("survives a restart: state is read back from disk, and no temp files are left", async () => {
    await swipe({ profileId: LIKED_ME[0], direction: "like" });
    await swipe({ profileId: NOT_LIKED_ME[0], direction: "pass" });

    const files = await fs.readdir(dataDir());
    expect(files).toEqual(["state.json"]);

    const onDisk = JSON.parse(await fs.readFile(path.join(dataDir(), "state.json"), "utf8"));
    expect(Object.keys(onDisk.swipes).sort()).toEqual([LIKED_ME[0], NOT_LIKED_ME[0]].sort());
    expect(onDisk.matches).toHaveLength(1);

    // A brand-new request (as after a server restart) sees the same data.
    const ids = (await (await feed("?limit=20")).json()).profiles.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(LIKED_ME[0]);
    expect(ids).not.toContain(NOT_LIKED_ME[0]);
    expect((await (await matchesRoute.GET()).json()).matches).toHaveLength(1);
  });

  it("starts from a clean demo if state.json is corrupt", async () => {
    await fs.writeFile(path.join(dataDir(), "state.json"), "{ not valid json", "utf8");
    expect((await (await feed("?limit=20")).json()).remaining).toBe(36);
    expect((await swipe({ profileId: LIKED_ME[0], direction: "like" })).status).toBe(200);
  });

  it("is created lazily: reading does not create state.json", async () => {
    await feed();
    await matchesRoute.GET();
    await expect(fs.access(path.join(dataDir(), "state.json"))).rejects.toThrow();
  });
});

describe("next.config rewrites", () => {
  it("aliases /feed, /swipe and /matches to /api/*", async () => {
    const rewrites = await nextConfig.rewrites?.();
    expect(Array.isArray(rewrites)).toBe(true);
    expect(rewrites).toEqual([
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
    ]);
  });
});
