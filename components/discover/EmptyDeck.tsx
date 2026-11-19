type Props = { onViewMatches: () => void };

/** No profiles left: a lavender hero card with a way to the Matches view. */
export default function EmptyDeck({ onViewMatches }: Props) {
  return (
    <div className="min-h-0 flex-1 pt-4">
      <div className="neo-hero">
        <div className="text-5xl" aria-hidden="true">
          🌙
        </div>
        <h2 className="neo-hero-title mt-3">You&apos;re all caught up</h2>
        <p className="mt-2 text-muted">No more profiles right now. Check back soon.</p>
        <button
          type="button"
          className="neo-btn neo-btn--secondary neo-press mt-5"
          onClick={onViewMatches}
        >
          View matches
        </button>
      </div>
    </div>
  );
}
