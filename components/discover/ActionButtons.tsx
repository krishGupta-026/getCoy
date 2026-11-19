import { Heart, X } from "lucide-react";

type Props = {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
};

/**
 * Pass (64px, white) and Like (72px, pink) buttons, 24px apart, plus the small
 * reassurance note. Clicking runs the same fly-out animation as a swipe.
 */
export default function ActionButtons({ onPass, onLike, disabled = false }: Props) {
  return (
    <div className="flex flex-none flex-col items-center gap-3 pt-2 pb-3">
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Pass"
          onClick={onPass}
          disabled={disabled}
          className="neo-circle neo-circle--pass neo-press"
        >
          <X size={30} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Like"
          onClick={onLike}
          disabled={disabled}
          className="neo-circle neo-circle--like neo-press"
        >
          <Heart size={32} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
      <p className="neo-helper">They only find out if it&apos;s mutual.</p>
    </div>
  );
}
