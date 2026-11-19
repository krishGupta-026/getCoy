import Image from "next/image";
import type { MatchEntry } from "@/lib/types";

type Props = {
  /** Newest first. null while the list is still loading. */
  matches: MatchEntry[] | null;
};

/** The Matches view: title with a count chip, one row per mutual match. */
export default function MatchesList({ matches }: Props) {
  return (
    <section aria-labelledby="matches-title" className="min-h-0 flex-1 overflow-y-auto pt-5 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="matches-title" className="neo-section-title">
          Your matches
        </h2>
        {matches !== null && <span className="neo-chip">{matches.length}</span>}
      </div>

      {matches === null ? (
        <div className="flex flex-col gap-3" role="status" aria-label="Loading matches">
          {[0, 1].map((i) => (
            <div key={i} className="neo-skeleton h-[88px] !rounded-[20px]" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="neo-slot">
          <p className="font-bold">No matches yet</p>
          <p className="mt-1 text-muted">
            Keep swiping. Matches show up here when you both like each other.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map(({ profile }, index) => (
            <li key={profile.id} className="neo-row">
              <span className="neo-avatar relative border-2 border-ink bg-surface">
                <Image
                  src={profile.photo}
                  alt=""
                  fill
                  sizes="56px"
                  unoptimized
                  loading={index < 6 ? "eager" : "lazy"}
                  className="object-cover"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold">
                  {profile.name}, {profile.age}
                </p>
                <p className="truncate text-sm text-muted">{profile.location}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="neo-helper mt-4">Only mutual likes show up here.</p>
    </section>
  );
}
