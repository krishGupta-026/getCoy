/**
 * Types and constants shared by client and server.
 *
 * Nothing in this file may describe who liked the user. The seed shape that holds
 * that secret exists only in server-side code.
 */

/** Public profile shape. The ONLY profile shape ever sent to the client. */
export type Profile = {
  id: string; // "p01" … "p36"
  name: string;
  age: number; // 18–25
  photo: string; // "/photos/p01.svg"
  bio: string; // ≤ 120 chars
  location: string;
  interests: string[]; // 3–5 items
};

/** The complete allow-list of fields a Profile may have. Used by the leak tests. */
export const PROFILE_FIELDS = [
  "id",
  "name",
  "age",
  "photo",
  "bio",
  "location",
  "interests",
] as const;

export type SwipeDirection = "like" | "pass";

export type FeedResponse = {
  profiles: Profile[];
  remaining: number;
};

export type SwipeResponse =
  | { matched: false; alreadySwiped?: true }
  | { matched: true; match: Profile; matchedAt: string; alreadySwiped?: true };

export type MatchEntry = { profile: Profile; matchedAt: string };

export type MatchesResponse = { matches: MatchEntry[] };

export type ApiError = { error: string };
