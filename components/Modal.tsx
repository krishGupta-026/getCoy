"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** id of the element that titles the dialog (for screen readers). */
  labelledBy: string;
  children: React.ReactNode;
  /** Extra classes for the sheet, e.g. "neo-modal--lavender". */
  className?: string;
  /** Show the round "X" button in the top-right corner. */
  closeButton?: boolean;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Coy modal: dim scrim, centered sheet (radius 28, padding 24, 2px ink border,
 * hard shadow). Escape and a click on the scrim close it. Focus moves into the
 * sheet (to the element marked `data-autofocus`, else the first control), is kept
 * there while open, and returns to where it was on close.
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
  className = "",
  closeButton = true,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <ModalLayer
          onClose={onClose}
          labelledBy={labelledBy}
          className={className}
          closeButton={closeButton}
        >
          {children}
        </ModalLayer>
      )}
    </AnimatePresence>
  );
}

function ModalLayer({
  onClose,
  labelledBy,
  className,
  closeButton,
  children,
}: Omit<Props, "open"> & { className: string; closeButton: boolean }) {
  const sheet = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const element = sheet.current;
    if (!element) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const initial = element.querySelector<HTMLElement>("[data-autofocus]");
    (initial ?? element.querySelector<HTMLElement>(FOCUSABLE) ?? element).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [...element.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === element)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!element.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <motion.div
      className="neo-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`neo-modal outline-none ${className}`}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0.1 } }
            : { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
        }
        transition={
          reduceMotion ? { duration: 0.12 } : { type: "spring", stiffness: 380, damping: 26 }
        }
      >
        {closeButton && (
          <button
            type="button"
            className="neo-icon-btn absolute top-4 right-4"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={22} strokeWidth={2.25} aria-hidden="true" />
          </button>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}
