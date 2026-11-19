import Logo from "@/components/Logo";
import SettingsButton from "@/components/SettingsButton";

/** 64px header: logo on the left, settings gear (opens the settings modal) on the right. */
export default function Header() {
  return (
    <header className="flex h-[calc(var(--header-h)+env(safe-area-inset-top))] shrink-0 items-center justify-between px-5 pt-[env(safe-area-inset-top)]">
      <Logo />
      <SettingsButton />
    </header>
  );
}
