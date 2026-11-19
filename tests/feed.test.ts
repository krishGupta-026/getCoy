import { describe, expect, it } from "vitest";
import { readState } from "@/lib/server/db";
import { buildFeed, getFeed, parseLimit } from "@/lib/server/feed";
import { swipe } from "@/lib/server/swipe";
import { withTempDataDir } from "./helpers";

withTempDataDir();

describe("getFeed()", () => {
  it("returns `limit` profiles and the total remaining", async () => {
    const feed = await getFeed(10);
    expect(feed.profiles).toHaveLength(10);
    expect(feed.remaining).toBe(36);
  });

  it("excludes swiped profiles (like or pass) and updates `remaining`", async () => {
    const first = (await getFeed(3)).profiles;
    await swipe(first[0].id, "like");
    await swipe(first[1].id, "pass");

    const next = await getFeed(36);
    const ids = next.profiles.map((p) => p.id);
    expect(ids).not.toContain(first[0].id);
    expect(ids).not.toContain(first[1].id);
    expect(ids).toContain(first[2].id);
    expect(next.remaining).toBe(34);
  });

  it("never returns a profile twice while the user swipes through the whole deck", async () => {
    const seen = new Set<string>();
    for (let guard = 0; guard < 20; guard++) {
      const { profiles, remaining } = await getFeed(7);
      if (profiles.length === 0) {
        expect(remaining).toBe(0);
        break;
      }
      for (const p of profiles) {
        expect(seen.has(p.id)).toBe(false);
        seen.add(p.id);
        await swipe(p.id, seen.size % 2 ? "like" : "pass");
      }
    }
    expect(seen.size).toBe(36);
  });

  it("returns an empty deck (not an error) when everything is swiped", async () => {
    for (const p of (await getFeed(20)).profiles) await swipe(p.id, "pass");
    for (const p of (await getFeed(20)).profiles) await swipe(p.id, "pass");
    expect(await getFeed(10)).toEqual({ profiles: [], remaining: 0 });
  });

  it("is stable: the same state gives the same order", async () => {
    const state = await readState();
    expect(buildFeed(state, 20)).toEqual(buildFeed(state, 20));
  });
});

describe("parseLimit()", () => {
  it("defaults to 10 when missing or not a whole number", () => {
    for (const raw of [null, undefined, "", "abc", "1.5", "NaN", "10px"]) {
      expect(parseLimit(raw)).toBe(10);
    }
  });
  it("accepts 1..20 and clamps numbers outside it", () => {
    expect(parseLimit("1")).toBe(1);
    expect(parseLimit("20")).toBe(20);
    expect(parseLimit("5")).toBe(5);
    expect(parseLimit("0")).toBe(1);
    expect(parseLimit("-4")).toBe(1);
    expect(parseLimit("999")).toBe(20);
  });
});
