import "server-only";
import type { MatchesResponse, SwipeDirection, SwipeResponse } from "@/lib/types";
import { readState, transact, type DbState } from "./db";
import { findSeedProfile, toProfile } from "./seed";

export type SwipeResult =
  | { status: "not_found" }
  | { status: "ok"; body: SwipeResponse };

/** Validates the JSON body of POST /api/swipe. Returns null when it is invalid. */
export function parseSwipeBody(
  body: unknown,
): { profileId: string; direction: SwipeDirection } | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const { profileId, direction } = body as Record<string, unknown>;
  if (typeof profileId !== "string" || profileId.length === 0) return null;
  if (direction !== "like" && direction !== "pass") return null;
  return { profileId, direction };
}

/**
 * Pure matching rule (mutates `state`, which the caller persists).
 *
 * - Unknown profile -> not_found.
 * - Already swiped -> nothing changes; returns the originally recorded outcome.
 * - A like on a profile that already likes the user creates a match.
 *   Everything else (a pass, or a like that is not returned) is just
 *   `{ matched: false }`, with exactly the same shape either way.
 *
 * This is the only place a MatchRecord is ever created.
 */
export function applySwipe(
  state: DbState,
  profileId: string,
  direction: SwipeDirection,
  now: Date = new Date(),
): SwipeResult {
  const seed = findSeedProfile(profileId);
  if (!seed) return { status: "not_found" };

  if (Object.hasOwn(state.swipes, profileId)) {
    const existing = state.matches.find((m) => m.profileId === profileId);
    return {
      status: "ok",
      body: existing
        ? { matched: true, match: toProfile(seed), matchedAt: existing.matchedAt, alreadySwiped: true }
        : { matched: false, alreadySwiped: true },
    };
  }

  const at = now.toISOString();
  state.swipes[profileId] = { profileId, direction, createdAt: at };

  if (direction === "like" && seed.likedMe) {
    state.matches.push({ profileId, matchedAt: at });
    return { status: "ok", body: { matched: true, match: toProfile(seed), matchedAt: at } };
  }
  return { status: "ok", body: { matched: false } };
}

export function swipe(
  profileId: string,
  direction: SwipeDirection,
  now?: Date,
): Promise<SwipeResult> {
  return transact((state) => applySwipe(state, profileId, direction, now));
}

/**
 * Pure: mutual matches, newest first. Each record is double-checked against the
 * swipe that produced it, so a hand-edited state file cannot invent a match.
 */
export function listMatches(state: DbState): MatchesResponse["matches"] {
  return state.matches
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => {
      const seed = findSeedProfile(record.profileId);
      const swipeRecord = Object.hasOwn(state.swipes, record.profileId)
        ? state.swipes[record.profileId]
        : undefined;
      return seed !== undefined && seed.likedMe && swipeRecord?.direction === "like";
    })
    .sort((a, b) =>
      a.record.matchedAt === b.record.matchedAt
        ? b.index - a.index
        : a.record.matchedAt < b.record.matchedAt
          ? 1
          : -1,
    )
    .map(({ record }) => ({
      profile: toProfile(findSeedProfile(record.profileId)!),
      matchedAt: record.matchedAt,
    }));
}

export async function getMatches(): Promise<MatchesResponse> {
  return { matches: listMatches(await readState()) };
}
