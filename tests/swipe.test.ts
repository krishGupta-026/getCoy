import { describe, expect, it } from "vitest";
import { readState } from "@/lib/server/db";
import { applySwipe, listMatches, parseSwipeBody, swipe } from "@/lib/server/swipe";
import { LIKED_ME, NOT_LIKED_ME, withTempDataDir } from "./helpers";

withTempDataDir();

const [likesMe, likesMe2] = LIKED_ME;
const [doesNotLikeMe] = NOT_LIKED_ME;

describe("swipe()", () => {
  it("like on a profile that likes me -> match", async () => {
    const result = await swipe(likesMe, "like");
    expect(result.status).toBe("ok");
    if (result.status !== "ok" || !result.body.matched) throw new Error("expected a match");
    expect(result.body.match.id).toBe(likesMe);
    expect(typeof result.body.matchedAt).toBe("string");
    expect((await readState()).matches).toHaveLength(1);
  });

  it("like on a profile that does not like me -> no match", async () => {
    const result = await swipe(doesNotLikeMe, "like");
    expect(result).toEqual({ status: "ok", body: { matched: false } });
    expect((await readState()).matches).toHaveLength(0);
  });

  it("pass on a profile that likes me -> no match", async () => {
    const result = await swipe(likesMe, "pass");
    expect(result).toEqual({ status: "ok", body: { matched: false } });
    expect((await readState()).matches).toHaveLength(0);
  });

  it("a pass is final: liking the same profile afterwards does not create a match", async () => {
    await swipe(likesMe, "pass");
    const second = await swipe(likesMe, "like");
    expect(second).toEqual({ status: "ok", body: { matched: false, alreadySwiped: true } });
    expect((await readState()).matches).toHaveLength(0);
  });

  it("repeating a swipe is idempotent and returns the original outcome", async () => {
    const first = await swipe(likesMe, "like");
    const again = await swipe(likesMe, "like");
    const flipped = await swipe(likesMe, "pass");
    if (first.status !== "ok" || !first.body.matched) throw new Error("expected a match");

    for (const repeat of [again, flipped]) {
      expect(repeat.status).toBe("ok");
      if (repeat.status !== "ok" || !repeat.body.matched) throw new Error("expected stored match");
      expect(repeat.body.alreadySwiped).toBe(true);
      expect(repeat.body.matchedAt).toBe(first.body.matchedAt);
    }

    const state = await readState();
    expect(Object.keys(state.swipes)).toHaveLength(1);
    expect(state.matches).toHaveLength(1);
    expect(state.swipes[likesMe].direction).toBe("like");
  });

  it("repeating a non-match returns matched:false with alreadySwiped", async () => {
    await swipe(doesNotLikeMe, "like");
    expect(await swipe(doesNotLikeMe, "like")).toEqual({
      status: "ok",
      body: { matched: false, alreadySwiped: true },
    });
  });

  it("unknown id -> not_found, and nothing is recorded", async () => {
    expect(await swipe("p99", "like")).toEqual({ status: "not_found" });
    expect(await swipe("__proto__", "like")).toEqual({ status: "not_found" });
    expect((await readState()).swipes).toEqual({});
  });

  it("serializes concurrent swipes: no lost writes, no duplicate matches", async () => {
    const ids = [...LIKED_ME, ...NOT_LIKED_ME];
    // every id swiped twice at once
    await Promise.all([...ids, ...ids].map((id) => swipe(id, "like")));
    const state = await readState();
    expect(Object.keys(state.swipes)).toHaveLength(36);
    expect(state.matches).toHaveLength(12);
    expect(new Set(state.matches.map((m) => m.profileId)).size).toBe(12);
  });
});

describe("parseSwipeBody()", () => {
  it("accepts a valid body", () => {
    expect(parseSwipeBody({ profileId: "p07", direction: "pass" })).toEqual({
      profileId: "p07",
      direction: "pass",
    });
  });
  it.each([
    null,
    "like",
    [],
    {},
    { profileId: "p07" },
    { direction: "like" },
    { profileId: 7, direction: "like" },
    { profileId: "", direction: "like" },
    { profileId: "p07", direction: "superlike" },
    { profileId: "p07", direction: "LIKE" },
  ])("rejects %j", (body) => {
    expect(parseSwipeBody(body)).toBeNull();
  });
});

describe("listMatches()", () => {
  it("lists newest first", () => {
    const state = { swipes: {}, matches: [] };
    applySwipe(state, likesMe, "like", new Date("2026-11-18T08:00:00.000Z"));
    applySwipe(state, likesMe2, "like", new Date("2026-11-18T09:00:00.000Z"));
    expect(listMatches(state).map((m) => m.profile.id)).toEqual([likesMe2, likesMe]);
  });

  it("only lists mutual matches, even if the state file was edited by hand", () => {
    const state = {
      swipes: {
        [doesNotLikeMe]: { profileId: doesNotLikeMe, direction: "like" as const, createdAt: "x" },
        [likesMe]: { profileId: likesMe, direction: "pass" as const, createdAt: "x" },
      },
      matches: [
        { profileId: doesNotLikeMe, matchedAt: "2026-11-18T08:00:00.000Z" }, // not mutual
        { profileId: likesMe, matchedAt: "2026-11-18T08:00:00.000Z" }, // was a pass
        { profileId: "p99", matchedAt: "2026-11-18T08:00:00.000Z" }, // unknown
      ],
    };
    expect(listMatches(state)).toEqual([]);
  });
});
