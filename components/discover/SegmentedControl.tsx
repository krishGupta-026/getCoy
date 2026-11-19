export type DiscoverTab = "swipe" | "matches";

type Props = {
  value: DiscoverTab;
  onChange: (tab: DiscoverTab) => void;
  /** Number of matches; shown as "Matches (n)" once there is at least one. */
  matchCount: number;
};

/**
 * [Swipe] [Matches (n)]: a soft track with no border; the selected segment is a
 * soft-pink pill with a 2px ink border and a small hard shadow.
 */
export default function SegmentedControl({ value, onChange, matchCount }: Props) {
  const options: { tab: DiscoverTab; label: string }[] = [
    { tab: "swipe", label: "Swipe" },
    { tab: "matches", label: matchCount > 0 ? `Matches (${matchCount})` : "Matches" },
  ];

  return (
    <div
      role="group"
      aria-label="Discover view"
      className="flex h-12 shrink-0 gap-1 rounded-full bg-surface p-1"
    >
      {options.map(({ tab, label }) => {
        const selected = tab === value;
        return (
          <button
            key={tab}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab)}
            className={`flex-1 rounded-full border-2 text-[15px] font-bold transition-colors duration-100 ${
              selected
                ? "border-ink bg-pink-soft text-ink shadow-[var(--shadow-sm)]"
                : "border-transparent text-muted"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
