import { Suspense } from "react";
import { ListingCardSkeleton } from "@/components/features/listings/ListingCard";
import CatalogContent from "./CatalogContent";

export const metadata = { title: "Katalog Lelang — BidMart" };

function CatalogSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-10 space-y-2">
          <div className="h-3 w-32 rounded bg-slate-100" />
          <div className="h-8 w-48 rounded bg-slate-200" />
        </div>
        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-9 w-full rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
          {/* Grid skeleton */}
          <div className="flex-1">
            <div className="mb-6 h-4 w-32 rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
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
