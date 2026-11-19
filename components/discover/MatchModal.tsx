"use client";

import Image from "next/image";
import { useState } from "react";
import Modal from "@/components/Modal";
import type { Profile } from "@/lib/types";

// Static confetti: a few dots in palette colors around the edges, popping in once.
const CONFETTI = [
  { left: "7%", top: "5%", size: 12, color: "var(--pink)", delay: 0 },
  { left: "88%", top: "7%", size: 10, color: "var(--yellow)", delay: 60 },
  { left: "20%", top: "15%", size: 8, color: "var(--sky)", delay: 120 },
  { left: "78%", top: "19%", size: 12, color: "var(--mint)", delay: 90 },
  { left: "5%", top: "34%", size: 10, color: "var(--yellow)", delay: 150 },
  { left: "93%", top: "38%", size: 8, color: "var(--pink)", delay: 30 },
  { left: "10%", top: "58%", size: 9, color: "var(--peach)", delay: 180 },
  { left: "90%", top: "62%", size: 11, color: "var(--sky)", delay: 210 },
] as const;

type Props = {
  /** The match to celebrate, or null when there is nothing to show. */
  match: Profile | null;
  /** "Keep swiping", Escape or a click outside. */
  onKeepSwiping: () => void;
  /** "View matches". */
  onViewMatches: () => void;
};

/** "It's a match!" screen. */
export default function MatchModal({ match, onKeepSwiping, onViewMatches }: Props) {
  // Keep showing the last match while the modal animates out, so it doesn't go blank.
  const [lastMatch, setLastMatch] = useState(match);
  if (match && match !== lastMatch) setLastMatch(match);
  const shown = match ?? lastMatch;

  return (
    <Modal
      open={match !== null}
      onClose={onKeepSwiping}
      labelledBy="match-title"
      className="neo-modal--lavender text-center"
      closeButton={false}
    >
      {shown && (
        <>
          {CONFETTI.map((dot, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="neo-confetti"
              style={{
                left: dot.left,
                top: dot.top,
                width: dot.size,
                height: dot.size,
                background: dot.color,
                animationDelay: `${dot.delay}ms`,
              }}
            />
          ))}

          <div className="text-5xl" aria-hidden="true">
            🎉
          </div>
          <h2
            id="match-title"
            className="mt-2 text-[34px] leading-[1.05] font-extrabold tracking-[-0.02em]"
          >
            It&apos;s a match!
          </h2>
          <p className="mt-2 text-muted">You and {shown.name} both liked each other.</p>

          <div className="mt-5 flex items-center justify-center" aria-hidden="true">
            <span className="neo-avatar !size-[88px] border-2 border-ink text-4xl">Y</span>
            <span className="neo-avatar relative -ml-5 !size-[88px] border-2 border-ink bg-surface">
              <Image src={shown.photo} alt="" fill sizes="88px" unoptimized className="object-cover" />
            </span>
          </div>

          <button
            type="button"
            data-autofocus
            className="neo-btn neo-btn--block neo-press mt-6"
            onClick={onViewMatches}
          >
            View matches
          </button>
          <button type="button" className="neo-link mt-4" onClick={onKeepSwiping}>
            Keep swiping
          </button>
        </>
      )}
    </Modal>
  );
}
