import { Settings } from "lucide-react";
import Logo from "@/components/Logo";

/**
 * 64px header: logo on the left, settings gear on the right.
 * The gear is wired up in step 8 (settings modal with "Reset demo data").
 */
export default function Header() {
  return (
    <header className="flex h-[calc(var(--header-h)+env(safe-area-inset-top))] shrink-0 items-center justify-between px-5 pt-[env(safe-area-inset-top)]">
      <Logo />
      <button type="button" className="neo-icon-btn" aria-label="Settings">
        <Settings size={22} strokeWidth={2.25} aria-hidden="true" />
      </button>
    </header>
  );
}
