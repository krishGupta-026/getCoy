"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Profile, SwipeDirection } from "@/lib/types";
import DeckFrame from "./DeckFrame";
import ProfileCard from "./ProfileCard";

/** Imperative API so buttons and arrow keys can trigger the same fly-out as a swipe. */
export type SwipeDeckHandle = {
  swipe: (direction: SwipeDirection) => void;
};

type Props = {
  /** Cards in order: index 0 is the interactive top card. Only the first 3 render. */
  profiles: Profile[];
  /** Called once a card has finished flying out. */
  onSwipe: (profile: Profile, direction: SwipeDirection) => void;
  ref?: React.Ref<SwipeDeckHandle>;
};

const VISIBLE_CARDS = 3;
const COMMIT_OFFSET = 110; // px dragged
const COMMIT_VELOCITY = 500; // px/s
const FLY_OUT_SECONDS = 0.28;

/** Card rotation follows x: ±14° at ±220px, easing on to ±20° while flying out. */
function rotationFor(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const distance = Math.abs(x);
  const degrees =
    distance <= 220 ? (distance / 220) * 14 : 14 + Math.min(1, (distance - 220) / 260) * 6;
  return sign * degrees;
}

type DeckCardHandle = { swipe: (direction: SwipeDirection) => void };

type DeckCardProps = {
  profile: Profile;
  index: number; // 0 = top of the deck
  reduceMotion: boolean;
  onCommit: (profile: Profile, direction: SwipeDirection) => void;
  ref?: React.Ref<DeckCardHandle>;
};

function DeckCard({ profile, index, reduceMotion, onCommit, ref }: DeckCardProps) {
  const isTop = index === 0;
  const x = useMotionValue(0);
  const fade = useMotionValue(1);
  const rotate = useTransform(x, (value) => (reduceMotion ? 0 : rotationFor(value)));

  // Feedback while dragging: stamps and tint (top card only).
  const likeStamp = useTransform(x, [20, 120], [0, 1]);
  const passStamp = useTransform(x, [-120, -20], [1, 0]);
  const likeTint = useTransform(x, [0, 150], [0, 0.35]);
  const passTint = useTransform(x, [-150, 0], [0.6, 0]);

  // Per-card lock: once a card is leaving, all further input on it is ignored.
  const locked = useRef(false);
  const mounted = useRef(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const commit = useCallback(
    async (direction: SwipeDirection) => {
      if (locked.current) return;
      locked.current = true;
      setLeaving(true);
      navigator.vibrate?.(10);

      if (reduceMotion) {
        await animate(fade, 0, { duration: 0.15 });
      } else {
        const target = (direction === "like" ? 1 : -1) * (window.innerWidth + 100);
        await Promise.all([
          animate(x, target, { duration: FLY_OUT_SECONDS, ease: "easeOut" }),
          animate(fade, 0, { duration: FLY_OUT_SECONDS, ease: "easeIn" }),
        ]);
      }
      if (mounted.current) onCommit(profile, direction);
    },
    [fade, onCommit, profile, reduceMotion, x],
  );

  useImperativeHandle(ref, () => ({ swipe: (direction) => void commit(direction) }), [commit]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (locked.current) return;
    const flicked = Math.abs(info.velocity.x) > COMMIT_VELOCITY;
    if (Math.abs(info.offset.x) > COMMIT_OFFSET || flicked) {
      // A fast flick decides the direction; otherwise the side it was dragged to.
      const direction = (flicked ? info.velocity.x : info.offset.x) > 0 ? "like" : "pass";
      void commit(direction);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      aria-hidden={!isTop}
      aria-roledescription={isTop ? "card" : undefined}
      aria-label={isTop ? `${profile.name}, ${profile.age}` : undefined}
      className={`absolute inset-0 touch-pan-y ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        x,
        rotate,
        opacity: fade,
        zIndex: VISIBLE_CARDS - index,
        transformOrigin: "50% 100%",
        pointerEvents: isTop && !leaving ? "auto" : "none",
      }}
      initial={false}
      animate={{ scale: 1 - index * 0.05, y: index * 10 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      drag={isTop && !leaving ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      dragSnapToOrigin
      onDragEnd={handleDragEnd}
    >
      <ProfileCard profile={profile} priority={isTop} flat={!isTop}>
        {isTop && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[26px] bg-pink-soft"
              style={{ opacity: likeTint }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[26px] bg-surface"
              style={{ opacity: passTint }}
            />
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute top-6 left-5 rounded-xl border-4 border-pink-deep px-3 text-[32px] leading-[1.2] font-extrabold text-pink-deep"
              style={{ opacity: likeStamp, rotate: -12 }}
            >
              LIKE
            </motion.span>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute top-6 right-5 rounded-xl border-4 border-ink px-3 text-[32px] leading-[1.2] font-extrabold text-ink"
              style={{ opacity: passStamp, rotate: 12 }}
            >
              PASS
            </motion.span>
          </>
        )}
      </ProfileCard>
    </motion.div>
  );
}

/**
 * The swipe deck: the top card is draggable, the next two sit behind it
 * (scale 0.95 / 0.9, 10px / 20px lower) and spring forward as cards leave.
 */
export default function SwipeDeck({ profiles, onSwipe, ref }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const topCard = useRef<DeckCardHandle>(null);

  useImperativeHandle(
    ref,
    () => ({ swipe: (direction) => topCard.current?.swipe(direction) }),
    [],
  );

  return (
    <DeckFrame role="group" aria-label="Profiles to swipe">
      {profiles.slice(0, VISIBLE_CARDS).map((profile, index) => (
        <DeckCard
          key={profile.id}
          profile={profile}
          index={index}
          reduceMotion={reduceMotion}
          onCommit={onSwipe}
          ref={index === 0 ? topCard : undefined}
        />
      ))}
    </DeckFrame>
  );
}
