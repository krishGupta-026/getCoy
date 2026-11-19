import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, fetchFeed, fetchMatches, postSwipe } from "@/lib/api-client";

afterEach(() => vi.unstubAllGlobals());

const stubFetch = (impl: (url: string, init?: RequestInit) => Promise<Response>) => {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
};
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api-client", () => {
  it("fetchFeed calls /api/feed with the limit and returns the JSON", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ profiles: [], remaining: 0 }));
    expect(await fetchFeed(7)).toEqual({ profiles: [], remaining: 0 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/feed?limit=7");
    expect(fetchMock.mock.calls[0][1]?.cache).toBe("no-store");
  });

  it("postSwipe sends the profile id and direction as JSON", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ matched: false }));
    expect(await postSwipe("p07", "like")).toEqual({ matched: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/swipe");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ profileId: "p07", direction: "like" });
  });

  it("fetchMatches reads /api/matches", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ matches: [] }));
    expect(await fetchMatches()).toEqual({ matches: [] });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/matches");
  });

  it("throws ApiRequestError with the HTTP status for error responses", async () => {
    stubFetch(async () => jsonResponse({ error: "profile_not_found" }, 404));
    const error = await postSwipe("p99", "like").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).status).toBe(404);
  });

  it("throws ApiRequestError with a null status when there is no network", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    const error = await fetchFeed().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect((error as ApiRequestError).status).toBeNull();
  });

  it("throws ApiRequestError when the body is not JSON", async () => {
    stubFetch(async () => new Response("<html>oops</html>", { status: 200 }));
    await expect(fetchMatches()).rejects.toBeInstanceOf(ApiRequestError);
  });
});
