"use client";

import { useEffect } from "react";

const VISIBLE_MS = 3000;

type Props = {
  toast: { id: number; message: string } | null;
  onDismiss: (id: number) => void;
};

/** Small ink-bordered pill at the top of the screen: ink text on yellow, gone after 3s. */
export default function Toast({ toast, onDismiss }: Props) {
  const id = toast?.id;

  useEffect(() => {
    if (id === undefined) return;
    const timer = setTimeout(() => onDismiss(id), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  if (!toast) return null;

  return (
    <div key={toast.id} role="status" aria-live="polite" className="neo-toast">
      {toast.message}
    </div>
  );
}
