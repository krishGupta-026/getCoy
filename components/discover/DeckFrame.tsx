/**
 * The area the deck (or its skeleton) occupies: fills the space between the
 * segmented control and the action buttons. Leaves room on the right for the 6px
 * hard shadow and at the bottom for the two cards stacked behind the top one.
 * Shared by SwipeDeck and CardSkeleton so loading -> ready causes no layout shift.
 */
export default function DeckFrame({
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative min-h-0 flex-1" {...rest}>
      <div className="absolute top-0 right-[6px] bottom-[26px] left-0">{children}</div>
    </div>
  );
}
