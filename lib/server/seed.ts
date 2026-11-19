import "server-only";
import seedJson from "@/data/profiles.json";
import type { Profile } from "@/lib/types";

/** The single hard-coded logged-in user. */
export const ME_ID = "me";

/**
 * Server-only seed shape. `likedMe` means "this profile already likes the
 * logged-in user". It is the secret behind Coy's core promise: never import this
 * type (or data/profiles.json) from client code.
 */
export type SeedProfile = Profile & { likedMe: boolean };

const SEED: readonly SeedProfile[] = seedJson as SeedProfile[];
const BY_ID: ReadonlyMap<string, SeedProfile> = new Map(SEED.map((p) => [p.id, p]));

export function getSeedProfiles(): readonly SeedProfile[] {
  return SEED;
}

export function findSeedProfile(id: string): SeedProfile | undefined {
  return BY_ID.get(id);
}

/**
 * SeedProfile -> Profile, with an explicit allow-list of fields. Never spread
 * or return the seed object: that is how `likedMe` would leak.
 */
export function toProfile(seed: SeedProfile): Profile {
  return {
    id: seed.id,
    name: seed.name,
    age: seed.age,
    photo: seed.photo,
    bio: seed.bio,
    location: seed.location,
    interests: [...seed.interests],
  };
}
