import "server-only";
import type { FeedResponse } from "@/lib/types";
import { readState, type DbState } from "./db";
import { getSeedProfiles, findSeedProfile, toProfile } from "./seed";
import { seededShuffle } from "./shuffle";

export const DEFAULT_LIMIT = 10;
export const MIN_LIMIT = 1;
export const MAX_LIMIT = 20;

/**
 * Seed for the feed order. Chosen with a throwaway search script (not at
 * runtime) so the first 8 cards contain 3 profiles that already like the user,
 * which lets a demo reach a match quickly. The order itself is a shuffle of the
 * profile ids only: it never reads `likedMe`, so it cannot be sorted by it.
 * tests/feed-order.test.ts pins both properties.
 */
export const FEED_SEED = 21;

/** Every profile id in feed order (stable, independent of any state). */
const FEED_ORDER: readonly string[] = seededShuffle(
  getSeedProfiles()
    .map((p) => p.id)
    .sort(),
  FEED_SEED,
);

export function getFeedOrder(): readonly string[] {
  return FEED_ORDER;
}

/** `?limit=`: missing or non-numeric -> 10, otherwise clamped to 1..20. */
export function parseLimit(raw: string | null | undefined): number {
  if (raw == null || !/^-?\d+$/.test(raw.trim())) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Number(raw.trim())));
}

/** Pure: the next `limit` profiles the user has not swiped on, as public Profiles. */
export function buildFeed(state: DbState, limit: number): FeedResponse {
  const unswiped = FEED_ORDER.filter((id) => !Object.hasOwn(state.swipes, id));
  const profiles = unswiped
    .slice(0, limit)
    .map((id) => findSeedProfile(id))
    .filter((p) => p !== undefined)
    .map(toProfile);
  return { profiles, remaining: unswiped.length };
}

export async function getFeed(limit: number): Promise<FeedResponse> {
  return buildFeed(await readState(), limit);
}
