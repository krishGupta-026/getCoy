import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GET as feedGET } from "@/app/api/feed/route";
import { GET as matchesGET } from "@/app/api/matches/route";
import { POST as swipePOST } from "@/app/api/swipe/route";
import { PROFILE_FIELDS } from "@/lib/types";
import { LIKED_ME, NOT_LIKED_ME, post, withTempDataDir } from "./helpers";

withTempDataDir();

const get = (route: typeof feedGET, url: string) => route(new Request(`http://localhost${url}`));
const swipeReq = (profileId: string, direction: string) =>
  swipePOST(post("/api/swipe", { profileId, direction }));

type Raw = { status: number; text: string; json: Record<string, unknown> };
async function raw(res: Response): Promise<Raw> {
  const text = await res.text();
  return { status: res.status, text, json: JSON.parse(text) };
}

const expectPublicProfile = (value: unknown) => {
  expect(Object.keys(value as object).sort()).toEqual([...PROFILE_FIELDS].sort());
};

describe("leak test: API responses", () => {
  it("never contain likedMe and only expose allow-listed Profile fields", async () => {
    const responses: Raw[] = [];

    responses.push(await raw(await get(feedGET, "/api/feed?limit=20")));
    responses.push(await raw(await swipeReq(LIKED_ME[0], "like"))); // match
    responses.push(await raw(await swipeReq(LIKED_ME[0], "like"))); // repeat of a match
    responses.push(await raw(await swipeReq(NOT_LIKED_ME[0], "like"))); // no match
    responses.push(await raw(await swipeReq(LIKED_ME[1], "pass"))); // pass on someone who likes me
    responses.push(await raw(await swipeReq(NOT_LIKED_ME[1], "pass")));
    responses.push(await raw(await swipeReq("p99", "like"))); // 404
    responses.push(await raw(await swipePOST(post("/api/swipe", "not json")))); // 400
    responses.push(await raw(await get(matchesGET as typeof feedGET, "/api/matches")));
    responses.push(await raw(await get(feedGET, "/api/feed?limit=20")));

    for (const r of responses) {
      expect(r.text.toLowerCase()).not.toContain("likedme");
      expect(r.text.toLowerCase()).not.toContain("liked_me");
    }

    // Feed profiles
    const feed = responses[0].json as { profiles: unknown[]; remaining: number };
    expect(Object.keys(feed).sort()).toEqual(["profiles", "remaining"]);
    feed.profiles.forEach(expectPublicProfile);

    // The match response
    const match = responses[1].json;
    expect(Object.keys(match).sort()).toEqual(["match", "matchedAt", "matched"].sort());
    expectPublicProfile(match.match);
    expect(Object.keys(responses[2].json).sort()).toEqual(["alreadySwiped", "match", "matchedAt", "matched"].sort());

    // Matches list
    const matches = (responses[8].json as { matches: { profile: unknown }[] }).matches;
    expect(matches).toHaveLength(1);
    expect(Object.keys(matches[0]).sort()).toEqual(["matchedAt", "profile"]);
    expectPublicProfile(matches[0].profile);
  });
});

describe("a non-match reveals nothing", () => {
  it("like (not returned), pass (on someone who likes me) and pass (on someone who does not) look identical", async () => {
    const likeNonMatch = await raw(await swipeReq(NOT_LIKED_ME[0], "like"));
    const passOnAdmirer = await raw(await swipeReq(LIKED_ME[0], "pass"));
    const passOnOther = await raw(await swipeReq(NOT_LIKED_ME[1], "pass"));

    for (const r of [likeNonMatch, passOnAdmirer, passOnOther]) {
      expect(r.status).toBe(200);
      expect(r.text).toBe('{"matched":false}');
    }
  });

  it("repeats of non-matches are identical too", async () => {
    await swipeReq(NOT_LIKED_ME[0], "like");
    await swipeReq(LIKED_ME[0], "pass");
    const a = await raw(await swipeReq(NOT_LIKED_ME[0], "like"));
    const b = await raw(await swipeReq(LIKED_ME[0], "pass"));
    expect(a).toEqual(b);
  });

  it("a passed-on admirer never comes back and never appears in matches", async () => {
    await swipeReq(LIKED_ME[0], "pass");
    const feed = (await raw(await get(feedGET, "/api/feed?limit=20"))).json as {
      profiles: { id: string }[];
    };
    expect(feed.profiles.map((p) => p.id)).not.toContain(LIKED_ME[0]);
    const matches = (await raw(await get(matchesGET as typeof feedGET, "/api/matches"))).json;
    expect(matches).toEqual({ matches: [] });
  });
});

describe("static check: client code cannot see the secret", () => {
  const root = process.cwd();
  const SKIP = new Set(["node_modules", ".next", "api", "server"]);

  function walk(dir: string, out: string[] = []): string[] {
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
    return out;
  }

  // Everything that is (or may be) bundled for the browser: not app/api, not lib/server.
  const files = ["app", "components", "hooks", "lib"].flatMap((d) => walk(path.join(root, d)));

  it("scans a meaningful number of client-side files", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("never references the secret flag, the seed file, or server-only modules", () => {
    const forbidden = [/likedMe/i, /profiles\.json/, /lib\/server/, /SeedProfile/, /server-only/];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        expect(pattern.test(source), `${path.relative(root, file)} matches ${pattern}`).toBe(false);
      }
    }
  });
});
