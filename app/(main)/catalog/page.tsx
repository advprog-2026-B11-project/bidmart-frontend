import { Suspense } from "react";
import { ListingCardSkeleton } from "@/components/features/listings/ListingCard";
import CatalogContent from "./CatalogContent";

export const metadata = { title: "Katalog Lelang — BidMart" };

function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <div className="hidden w-56 shrink-0 space-y-6 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="h-9 w-full rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="flex-1">
          <div className="mb-5 h-5 w-40 rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}
