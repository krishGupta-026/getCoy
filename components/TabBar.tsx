"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, House, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/discover", label: "Discover", Icon: Flame },
];

/**
 * Bottom tab bar: white, 2px ink top border, 68px tall plus the bottom safe area.
 * Active tab is a pink pill (2px ink border, small hard shadow); inactive tabs are
 * muted with a transparent border so nothing shifts when the tab changes.
 */
export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="flex h-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] shrink-0 items-stretch border-t-2 border-ink bg-paper px-3 pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex h-full flex-1 items-center justify-center"
          >
            <span
              className={`inline-flex h-11 items-center gap-2 rounded-full border-2 px-5 text-[15px] font-bold transition-colors duration-100 ${
                active
                  ? "border-ink bg-pink text-ink shadow-[var(--shadow-sm)]"
                  : "border-transparent text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={2.25} aria-hidden="true" />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
