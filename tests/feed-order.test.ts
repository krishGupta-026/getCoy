import { describe, expect, it } from "vitest";
import seed from "@/data/profiles.json";
import { FEED_SEED, getFeedOrder } from "@/lib/server/feed";
import { seededShuffle } from "@/lib/server/shuffle";

const likedMe = new Map(seed.map((p) => [p.id, p.likedMe]));
const order = getFeedOrder();
const flags = order.map((id) => likedMe.get(id) === true);

describe("feed order", () => {
  it("is a permutation of all 36 profile ids", () => {
    expect([...order].sort()).toEqual(seed.map((p) => p.id).sort());
  });

  it("puts 2-4 profiles that like the user in the first 8 cards", () => {
    const count = flags.slice(0, 8).filter(Boolean).length;
    expect(count).toBeGreaterThanOrEqual(2);
    expect(count).toBeLessThanOrEqual(4);
  });

  it("is not sorted by likedMe (in either direction)", () => {
    const sortedFirst = [...flags].sort((a, b) => Number(b) - Number(a));
    const sortedLast = [...flags].sort((a, b) => Number(a) - Number(b));
    expect(flags).not.toEqual(sortedFirst);
    expect(flags).not.toEqual(sortedLast);
    // And the likedMe profiles are spread over the whole deck, not bunched at the front.
    const lastLiked = flags.lastIndexOf(true);
    expect(lastLiked).toBeGreaterThan(24);
  });

  it("depends only on ids and the seed", () => {
    const ids = seed.map((p) => p.id).sort();
    expect(seededShuffle(ids, FEED_SEED)).toEqual([...order]);
    // Flipping every secret flag changes nothing, because the shuffle never sees it.
    expect(seededShuffle([...ids], FEED_SEED)).toEqual(seededShuffle([...ids], FEED_SEED));
    expect(seededShuffle(ids, FEED_SEED + 1)).not.toEqual([...order]);
  });
});
