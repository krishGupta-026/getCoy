import { Suspense } from "react";
import CardSkeleton from "@/components/discover/CardSkeleton";
import DiscoverView from "@/components/discover/DiscoverView";

/**
 * DiscoverView reads ?view= with useSearchParams, which needs a Suspense
 * boundary on a statically rendered page. The fallback mirrors the loading layout
 * (control, skeleton card, space for the buttons) so nothing jumps on hydration.
 */
export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col pt-2">
          <div className="h-12 shrink-0 rounded-full bg-surface" />
          <CardSkeleton />
          <div className="h-[121px] shrink-0" />
        </div>
      }
    >
      <DiscoverView />
    </Suspense>
  );
}
