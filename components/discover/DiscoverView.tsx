"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedResponse, Profile, SwipeDirection } from "@/lib/types";
import { useSwipeKeys } from "@/hooks/useSwipeKeys";
import ActionButtons from "./ActionButtons";
import SwipeDeck, { type SwipeDeckHandle } from "./SwipeDeck";

/**
 * TEMPORARY step-5 harness: fetches one batch and removes cards locally so the
 * deck can be exercised end to end. Step 6 replaces the state handling with the
 * `useDiscover` hook (optimistic swipes, dedupe, prefetch, rollback, toasts) and
 * step 7 adds matches, the segmented control and the empty/loading/error states.
 */
export default function DiscoverView() {
  const [queue, setQueue] = useState<Profile[]>([]);
  const deck = useRef<SwipeDeckHandle>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feed?limit=20")
      .then((res) => res.json() as Promise<FeedResponse>)
      .then((feed) => {
        if (!cancelled) setQueue(feed.profiles);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSwiped = useCallback((profile: Profile, direction: SwipeDirection) => {
    setQueue((current) => current.filter((p) => p.id !== profile.id));
    void fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id, direction }),
    }).catch(() => undefined);
  }, []);

  const swipeTop = useCallback((direction: SwipeDirection) => deck.current?.swipe(direction), []);
  useSwipeKeys(swipeTop, queue.length > 0);

  return (
    <div className="flex h-full flex-col pt-2">
      <SwipeDeck ref={deck} profiles={queue} onSwipe={handleSwiped} />
      <ActionButtons
        onPass={() => swipeTop("pass")}
        onLike={() => swipeTop("like")}
        disabled={queue.length === 0}
      />
    </div>
  );
}
