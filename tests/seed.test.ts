import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import seed from "@/data/profiles.json";

const POOL = [
  "Music", "Cricket", "Coding", "Anime", "Photography", "Gym", "Dance", "Chai", "Travel",
  "Books", "Gaming", "Cooking", "Football", "Stand-up", "Art", "Movies", "Running", "Podcasts",
];

describe("seed data (data/profiles.json)", () => {
  it("has 36 unique profiles with ids p01..p36", () => {
    expect(seed).toHaveLength(36);
    const ids = seed.map((p) => p.id);
    expect(new Set(ids).size).toBe(36);
    expect(ids).toEqual(Array.from({ length: 36 }, (_, i) => `p${String(i + 1).padStart(2, "0")}`));
  });

  it("has exactly 12 profiles that already like the user, spread across the list", () => {
    const liked = seed.map((p, i) => (p.likedMe ? i : -1)).filter((i) => i >= 0);
    expect(liked).toHaveLength(12);
    // Spread: at least one in each quarter of the list.
    for (let q = 0; q < 4; q++) {
      expect(liked.some((i) => i >= q * 9 && i < (q + 1) * 9)).toBe(true);
    }
  });

  it("every profile is complete and within the allowed ranges", () => {
    for (const p of seed) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.age).toBeLessThanOrEqual(25);
      expect(p.bio.length).toBeGreaterThan(0);
      expect(p.bio.length).toBeLessThanOrEqual(120);
      expect(p.location.length).toBeGreaterThan(0);
      expect(p.interests.length).toBeGreaterThanOrEqual(3);
      expect(p.interests.length).toBeLessThanOrEqual(5);
      for (const interest of p.interests) expect(POOL).toContain(interest);
      expect(p.photo).toBe(`/photos/${p.id}.svg`);
    }
  });

  it("has a generated photo on disk for every profile", () => {
    for (const p of seed) {
      const file = path.join(process.cwd(), "public", p.photo);
      expect(fs.existsSync(file), `${p.photo} is missing; run npm run photos`).toBe(true);
    }
  });
});
