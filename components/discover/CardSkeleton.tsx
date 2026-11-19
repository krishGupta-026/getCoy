import DeckFrame from "./DeckFrame";

/** Loading state: a surface-colored card with a subtle pulse (no spinner). */
export default function CardSkeleton() {
  return (
    <DeckFrame aria-busy="true" aria-label="Loading profiles" role="status">
      <div className="neo-skeleton h-full" />
    </DeckFrame>
  );
}
