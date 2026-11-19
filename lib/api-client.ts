import type { FeedResponse, MatchesResponse, SwipeDirection, SwipeResponse } from "./types";

/**
 * Anything that goes wrong talking to the API. `status` is the HTTP status, or
 * null when no response arrived at all (offline, server down).
 */
export class ApiRequestError extends Error {
  readonly status: number | null;

  constructor(status: number | null, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new ApiRequestError(null, "Network error");
  }
  if (!response.ok) {
    throw new ApiRequestError(response.status, `Request failed (${response.status})`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiRequestError(response.status, "Invalid response");
  }
}

export function fetchFeed(limit = 10): Promise<FeedResponse> {
  return request<FeedResponse>(`/api/feed?limit=${limit}`);
}

export function postSwipe(profileId: string, direction: SwipeDirection): Promise<SwipeResponse> {
  return request<SwipeResponse>("/api/swipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, direction }),
  });
}

export function fetchMatches(): Promise<MatchesResponse> {
  return request<MatchesResponse>("/api/matches");
}
