import Header from "@/components/Header";
import TabBar from "@/components/TabBar";

/**
 * Shared shell for every tab: a centered 480px column that is exactly one
 * viewport tall (100dvh), with the header on top, the tab bar at the bottom of
 * the column, and the tab content filling the space in between. Because the
 * page itself never scrolls, the Discover swipe view can fit without page scroll.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col">
      <Header />
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5">{children}</main>
      <TabBar />
    </div>
  );
}
