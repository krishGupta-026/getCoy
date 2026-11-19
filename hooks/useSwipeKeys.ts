"use client";

import { useEffect } from "react";
import type { SwipeDirection } from "@/lib/types";

/**
 * ArrowRight = like, ArrowLeft = pass. Ignored while `enabled` is false (Matches
 * view or a modal is open), while typing in a field, with modifier keys held, and
 * for auto-repeat so holding a key doesn't rip through the deck.
 */
export function useSwipeKeys(onSwipe: (direction: SwipeDirection) => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? "")) {
        return;
      }

      event.preventDefault();
      onSwipe(event.key === "ArrowRight" ? "like" : "pass");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSwipe, enabled]);
}
