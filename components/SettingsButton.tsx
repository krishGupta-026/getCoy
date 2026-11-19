"use client";

import { Settings } from "lucide-react";
import { useCallback, useState } from "react";
import Modal from "@/components/Modal";
import { ApiRequestError, resetDemo } from "@/lib/api-client";
import { announceDemoReset } from "@/lib/demo-reset";

/**
 * The header's settings gear and its modal. The modal has one action,
 * "Reset demo data": it calls POST /api/reset, then tells the Discover tab to
 * reload (see lib/demo-reset.ts) and closes.
 */
export default function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (busy) return; // don't dismiss mid-request: the user would miss a failure
    setOpen(false);
    setError(null);
  }, [busy]);

  const reset = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await resetDemo();
      announceDemoReset();
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiRequestError && err.status === 403
          ? "Resetting is turned off on this server."
          : "Couldn't reset the demo. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="neo-icon-btn"
        aria-label="Settings"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Settings size={22} strokeWidth={2.25} aria-hidden="true" />
      </button>

      <Modal open={open} onClose={close} labelledBy="settings-title">
        <h2 id="settings-title" className="pr-12 text-[28px] leading-[1.1] font-extrabold tracking-[-0.02em]">
          Settings
        </h2>
        <p className="mt-2 text-muted">
          Start the demo over: every swipe and match is cleared and all profiles come back.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm font-bold text-pink-deep">
            {error}
          </p>
        )}

        <button
          type="button"
          data-autofocus
          className="neo-btn neo-btn--block neo-press mt-5"
          onClick={reset}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Resetting…" : "Reset demo data"}
        </button>
        <div className="mt-4 text-center">
          <button type="button" className="neo-link neo-link--muted" onClick={close}>
            Go back
          </button>
        </div>
      </Modal>
    </>
  );
}
