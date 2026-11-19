"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import Toast from "@/components/Toast";
import { useDiscover } from "@/hooks/useDiscover";
import { useSwipeKeys } from "@/hooks/useSwipeKeys";
import type { SwipeDirection } from "@/lib/types";
import ActionButtons from "./ActionButtons";
import CardSkeleton from "./CardSkeleton";
import EmptyDeck from "./EmptyDeck";
import FeedError from "./FeedError";
import MatchesList from "./MatchesList";
import MatchModal from "./MatchModal";
import SegmentedControl, { type DiscoverTab } from "./SegmentedControl";
import SwipeDeck, { type SwipeDeckHandle } from "./SwipeDeck";

/**
 * The Discover tab: segmented control (Swipe / Matches), the swipe deck with its
 * loading / empty / error states, the Matches list, the "It's a match!" screen
 * and toasts. The active view lives in the URL (?view=matches), so a reload
 * keeps it; switching uses history.replaceState, which Next.js syncs with
 * useSearchParams without a navigation.
 */
export default function DiscoverView() {
  const {
    view: feedView,
    queue,
    pendingMatch,
    matches,
    swipe,
    retry,
    refreshMatches,
    dismissMatch,
    clearPendingMatches,
    toast,
    dismissToast,
  } = useDiscover();
  const deck = useRef<SwipeDeckHandle>(null);

  const searchParams = useSearchParams();
  const tab: DiscoverTab = searchParams.get("view") === "matches" ? "matches" : "swipe";

  const setTab = useCallback((next: DiscoverTab) => {
    window.history.replaceState(null, "", next === "matches" ? "/discover?view=matches" : "/discover");
  }, []);

  // Opening the Matches view always refreshes the list.
  useEffect(() => {
    if (tab === "matches") void refreshMatches();
  }, [tab, refreshMatches]);

  const canSwipe = tab === "swipe" && feedView === "ready" && !pendingMatch;
  const swipeTop = useCallback((direction: SwipeDirection) => deck.current?.swipe(direction), []);
  useSwipeKeys(swipeTop, canSwipe);

  const viewMatches = useCallback(() => {
    clearPendingMatches();
    setTab("matches");
  }, [clearPendingMatches, setTab]);

  return (
    <div className="flex h-full flex-col pt-2">
      <SegmentedControl value={tab} onChange={setTab} matchCount={matches?.length ?? 0} />

      {tab === "matches" ? (
        <MatchesList matches={matches} />
      ) : (
        <>
          {feedView === "loading" && <CardSkeleton />}
          {feedView === "ready" && <SwipeDeck ref={deck} profiles={queue} onSwipe={swipe} />}
          {feedView === "empty" && <EmptyDeck onViewMatches={viewMatches} />}
          {feedView === "error" && <FeedError onRetry={retry} />}

          {(feedView === "loading" || feedView === "ready") && (
            <ActionButtons
              onPass={() => swipeTop("pass")}
              onLike={() => swipeTop("like")}
              disabled={!canSwipe}
            />
          )}
        </>
      )}

      <MatchModal match={pendingMatch} onKeepSwiping={dismissMatch} onViewMatches={viewMatches} />
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
