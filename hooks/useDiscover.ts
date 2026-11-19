"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiRequestError, fetchFeed, fetchMatches, postSwipe } from "@/lib/api-client";
import { DEMO_RESET_EVENT } from "@/lib/demo-reset";
import type { MatchEntry, Profile, SwipeDirection } from "@/lib/types";

/** Profiles requested per feed call. */
export const FEED_BATCH = 10;
/** Fetch the next batch once this many cards (or fewer) are left in the queue. */
export const PREFETCH_AT = 3;

export const SWIPE_FAILED_MESSAGE = "Couldn't save that swipe. Try again.";
export const PROFILE_GONE_MESSAGE = "That profile isn't available anymore.";
export const DEMO_RESET_MESSAGE = "Demo data reset.";

// ---------------------------------------------------------------------------
// State (pure reducer, unit-tested in tests/discover-reducer.test.ts)
// ---------------------------------------------------------------------------

export type DiscoverState = {
  /** Cards still to swipe. Index 0 is the top of the deck. */
  queue: Profile[];
  /** Every id swiped in this session, including swipes whose request is still in flight. */
  seenIds: ReadonlySet<string>;
  /** The last feed call brought nothing new: there is nothing beyond the queue. */
  exhausted: boolean;
  /** The last feed call failed. Cleared by a swipe or an explicit retry. */
  feedError: boolean;
  /** Matches waiting to be celebrated, one at a time. */
  matchQueue: Profile[];
  /** The Matches list, newest first. null until it has loaded once. */
  matches: MatchEntry[] | null;
  toast: { id: number; message: string } | null;
  toastSeq: number;
  /** Bumped by `reset`, so the loading effect runs again even if nothing else changed. */
  epoch: number;
};

export const initialDiscoverState: DiscoverState = {
  queue: [],
  seenIds: new Set(),
  exhausted: false,
  feedError: false,
  matchQueue: [],
  matches: null,
  toast: null,
  toastSeq: 0,
  epoch: 0,
};

export type DiscoverAction =
  | { type: "feedLoaded"; profiles: Profile[] }
  | { type: "feedFailed" }
  | { type: "retry" }
  | { type: "swiped"; profile: Profile }
  | { type: "rollback"; profile: Profile }
  | { type: "matched"; profile: Profile }
  | { type: "matchDismissed" }
  | { type: "matchQueueCleared" }
  | { type: "matchesLoaded"; matches: MatchEntry[] }
  | { type: "toast"; message: string }
  | { type: "toastDismissed"; id: number }
  | { type: "reset" };

export function discoverReducer(state: DiscoverState, action: DiscoverAction): DiscoverState {
  switch (action.type) {
    case "feedLoaded": {
      // Drop anything already swiped (guards races with in-flight swipes), already
      // queued, or repeated inside the batch itself.
      const taken = new Set(state.queue.map((p) => p.id));
      const fresh: Profile[] = [];
      for (const profile of action.profiles) {
        if (state.seenIds.has(profile.id) || taken.has(profile.id)) continue;
        taken.add(profile.id);
        fresh.push(profile);
      }
      return {
        ...state,
        queue: [...state.queue, ...fresh],
        exhausted: fresh.length === 0,
        feedError: false,
      };
    }

    case "feedFailed":
      return { ...state, feedError: true };

    case "retry":
      return { ...state, feedError: false };

    case "swiped": {
      // Optimistic: the card leaves the queue now; the request follows.
      const seenIds = new Set(state.seenIds).add(action.profile.id);
      return {
        ...state,
        queue: state.queue.filter((p) => p.id !== action.profile.id),
        seenIds,
        feedError: false,
      };
    }

    case "rollback": {
      // The request failed: put the card back on top so the user can try again.
      const seenIds = new Set(state.seenIds);
      seenIds.delete(action.profile.id);
      const alreadyQueued = state.queue.some((p) => p.id === action.profile.id);
      return {
        ...state,
        queue: alreadyQueued ? state.queue : [action.profile, ...state.queue],
        seenIds,
      };
    }

    case "matched":
      if (state.matchQueue.some((p) => p.id === action.profile.id)) return state;
      return { ...state, matchQueue: [...state.matchQueue, action.profile] };

    case "matchDismissed":
      return { ...state, matchQueue: state.matchQueue.slice(1) };

    case "matchQueueCleared":
      return state.matchQueue.length === 0 ? state : { ...state, matchQueue: [] };

    case "matchesLoaded":
      return { ...state, matches: action.matches };

    case "toast": {
      const id = state.toastSeq + 1;
      return { ...state, toastSeq: id, toast: { id, message: action.message } };
    }

    case "toastDismissed":
      // Only dismiss the toast that asked: a newer one must not be cut short.
      return state.toast?.id === action.id ? { ...state, toast: null } : state;

    case "reset":
      return { ...initialDiscoverState, toastSeq: state.toastSeq, epoch: state.epoch + 1 };
  }
}

export type DiscoverView = "loading" | "ready" | "empty" | "error";

/** What the Swipe view should show right now. */
export function deriveView(state: DiscoverState): DiscoverView {
  if (state.queue.length > 0) return "ready";
  if (state.feedError) return "error";
  if (state.exhausted) return "empty";
  return "loading";
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useDiscover() {
  const [state, dispatch] = useReducer(discoverReducer, initialDiscoverState);

  // `generation` changes on reset; responses from before it are ignored.
  const generation = useRef(0);
  const feedInFlight = useRef(false);
  const matchesRequest = useRef(0);

  const refreshMatches = useCallback(async () => {
    const request = ++matchesRequest.current;
    const gen = generation.current;
    try {
      const { matches } = await fetchMatches();
      if (request === matchesRequest.current && gen === generation.current) {
        dispatch({ type: "matchesLoaded", matches });
      }
    } catch {
      // Keep whatever list we already have.
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (feedInFlight.current) return;
    feedInFlight.current = true;
    const gen = generation.current;
    try {
      const { profiles } = await fetchFeed(FEED_BATCH);
      if (gen === generation.current) dispatch({ type: "feedLoaded", profiles });
    } catch {
      if (gen === generation.current) dispatch({ type: "feedFailed" });
    } finally {
      feedInFlight.current = false;
    }
  }, []);

  // Initial load, and prefetch whenever the queue runs low.
  const queueLength = state.queue.length;
  useEffect(() => {
    if (queueLength <= PREFETCH_AT && !state.exhausted && !state.feedError) void loadMore();
  }, [queueLength, state.exhausted, state.feedError, state.epoch, loadMore]);

  useEffect(() => {
    void refreshMatches();
  }, [refreshMatches, state.epoch]);

  const swipe = useCallback(
    (profile: Profile, direction: SwipeDirection) => {
      const gen = generation.current;
      dispatch({ type: "swiped", profile });

      postSwipe(profile.id, direction).then(
        (result) => {
          if (gen !== generation.current) return;
          if (result.matched) {
            dispatch({ type: "matched", profile: result.match });
            void refreshMatches();
          }
        },
        (error: unknown) => {
          if (gen !== generation.current) return;
          if (error instanceof ApiRequestError && error.status === 404) {
            // The profile no longer exists: bringing it back would trap the user on it.
            dispatch({ type: "toast", message: PROFILE_GONE_MESSAGE });
          } else {
            dispatch({ type: "rollback", profile });
            dispatch({ type: "toast", message: SWIPE_FAILED_MESSAGE });
          }
        },
      );
    },
    [refreshMatches],
  );

  /** Start over from the server's current state (used after "Reset demo data"). */
  const reload = useCallback(() => {
    generation.current += 1;
    feedInFlight.current = false;
    dispatch({ type: "reset" });
  }, []);

  // "Reset demo data" (settings modal): start over from the server's fresh state.
  useEffect(() => {
    const onDemoReset = () => {
      reload();
      dispatch({ type: "toast", message: DEMO_RESET_MESSAGE });
    };
    window.addEventListener(DEMO_RESET_EVENT, onDemoReset);
    return () => window.removeEventListener(DEMO_RESET_EVENT, onDemoReset);
  }, [reload]);

  const retry = useCallback(() => dispatch({ type: "retry" }), []);
  const dismissMatch = useCallback(() => dispatch({ type: "matchDismissed" }), []);
  const clearPendingMatches = useCallback(() => dispatch({ type: "matchQueueCleared" }), []);
  const dismissToast = useCallback((id: number) => dispatch({ type: "toastDismissed", id }), []);

  return {
    view: deriveView(state),
    queue: state.queue,
    /** The match to celebrate right now, if any. */
    pendingMatch: state.matchQueue[0] ?? null,
    matches: state.matches,
    toast: state.toast,
    swipe,
    retry,
    reload,
    refreshMatches,
    dismissMatch,
    clearPendingMatches,
    dismissToast,
  };
}
