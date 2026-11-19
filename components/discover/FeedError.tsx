type Props = { onRetry: () => void };

/** The feed could not be loaded: hero-card style error with a retry button. */
export default function FeedError({ onRetry }: Props) {
  return (
    <div className="min-h-0 flex-1 pt-4">
      <div className="neo-hero" role="alert">
        <div className="text-5xl" aria-hidden="true">
          🙈
        </div>
        <h2 className="neo-hero-title mt-3">Couldn&apos;t load profiles</h2>
        <p className="mt-2 text-muted">Check your connection and try again.</p>
        <button
          type="button"
          className="neo-btn neo-btn--secondary neo-press mt-5"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
