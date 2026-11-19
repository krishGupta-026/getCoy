import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Profile } from "@/lib/types";

// Interest chips cycle through these soft fills (no border).
const CHIP_FILLS = ["bg-surface", "bg-lavender", "bg-mint", "bg-peach"] as const;

type Props = {
  profile: Profile;
  /** Overlays (LIKE / PASS stamps, drag tint) rendered on top of the card. */
  children?: React.ReactNode;
  /** Load the photo eagerly (true for the card on top of the deck). */
  priority?: boolean;
  /** Drop the hard shadow (cards stacked behind the top one show only their edge). */
  flat?: boolean;
};

/**
 * The visual card: white, 2px ink border, 28px radius, hard shadow.
 * Photo on top (it shrinks first when space is short), then name and age,
 * location, bio and interest chips. Purely presentational: no gestures here.
 */
export default function ProfileCard({ profile, children, priority = false, flat = false }: Props) {
  return (
    <article
      className={`neo-card relative flex h-full flex-col overflow-hidden p-1 select-none ${flat ? "shadow-none" : ""}`}
    >
      <div className="relative min-h-[88px] flex-[1_1_60%] overflow-hidden rounded-[22px] bg-surface">
        <Image
          src={profile.photo}
          alt=""
          fill
          sizes="480px"
          unoptimized
          priority={priority}
          draggable={false}
          className="pointer-events-none object-cover object-[50%_40%]"
        />
      </div>

      <div className="flex-none px-3 pt-3 pb-2">
        <h2 className="text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em]">
          {profile.name}, {profile.age}
        </h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin size={15} strokeWidth={2.25} aria-hidden="true" />
          {profile.location}
        </p>
        <p className="mt-2 line-clamp-2 text-base leading-[1.3] text-ink">{profile.bio}</p>
        <ul className="mt-2 flex max-h-[62px] flex-wrap gap-1.5 overflow-hidden">
          {profile.interests.map((interest, i) => (
            <li key={interest} className={`neo-tag ${CHIP_FILLS[i % CHIP_FILLS.length]}`}>
              {interest}
            </li>
          ))}
        </ul>
      </div>

      {children}
    </article>
  );
}
