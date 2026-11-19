import { Settings } from "lucide-react";

/**
 * TEMPORARY step-1 token check. Step 2 replaces this file with a redirect to
 * /discover. It exists only to eyeball the design tokens and .neo-* recipes.
 */
export default function TokenCheck() {
  return (
    <main className="neo-column flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <span className="flex items-baseline gap-1 text-[32px] font-extrabold tracking-[-0.04em]">
          coy
          <span className="inline-block size-[10px] rounded-full bg-pink" />
        </span>
        <button className="neo-icon-btn" aria-label="Settings">
          <Settings size={22} strokeWidth={2.25} />
        </button>
      </div>

      <section className="neo-hero">
        <div className="text-4xl">🎉</div>
        <h1 className="neo-hero-title mt-3">Design tokens</h1>
        <p className="mt-2 text-muted">Scaffold is ready. Step 2 builds the shell.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="neo-btn neo-press">Primary</button>
          <button className="neo-btn neo-btn--secondary neo-press">Secondary</button>
        </div>
      </section>

      <div className="neo-row">
        <span className="neo-avatar border-2 border-ink">A</span>
        <div>
          <div className="font-bold">Ananya, 21</div>
          <div className="text-muted">Delhi University</div>
        </div>
        <span className="neo-chip ml-auto">3</span>
      </div>

      <div className="neo-slot">
        <div className="font-bold">No matches yet</div>
        <p className="text-muted">Dashed empty-slot recipe.</p>
      </div>
    </main>
  );
}
