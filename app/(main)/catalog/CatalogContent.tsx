"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { ListingCard, ListingCardSkeleton } from "@/components/features/listings/ListingCard";
import {
  ListingFilters,
  DEFAULT_FILTERS,
  type FilterValues,
} from "@/components/features/listings/ListingFilters";
import { AuctionStatus } from "@/constants/enums";
import * as listingsApi from "@/lib/api/listings";
import type { Listing } from "@/types/api";

const PAGE_SIZE = 12;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function sortListings(listings: Listing[], sort: FilterValues["sort"]): Listing[] {
  const copy = [...listings];
  switch (sort) {
    case "ending-soon":
      return copy.sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
    case "highest-bid":
      return copy.sort((a, b) => b.currentPrice - a.currentPrice);
    default:
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

function filterByStatus(listings: Listing[], status: FilterValues["status"]): Listing[] {
  if (status === "active") return listings.filter((l) => l.status === AuctionStatus.ACTIVE);
  if (status === "ended") {
    return listings.filter(
      (l) =>
        l.status === AuctionStatus.ENDED ||
        l.status === AuctionStatus.CLOSED ||
        l.status === AuctionStatus.SOLD ||
        l.status === AuctionStatus.WON
    );
  }
  return listings;
}

function parseFiltersFromUrl(sp: URLSearchParams): FilterValues {
  return {
    keyword:  sp.get("keyword")  ?? "",
    category: sp.get("category") ?? "",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    status:   (sp.get("status")  as FilterValues["status"])  ?? "active",
    sort:     (sp.get("sort")    as FilterValues["sort"])    ?? "newest",
  };
}

/* ─── Empty State ────────────────────────────────────────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Search className="h-7 w-7 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">Tidak ada karya yang cocok</h3>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        Coba ubah kata kunci atau hapus beberapa filter.
      </p>
      <button
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <X className="h-3.5 w-3.5" />
        Hapus semua filter
      </button>
    </div>
  );
}

/* ─── Main Content ───────────────────────────────────────────────────────── */

export default function CatalogContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [filters, setFilters]   = useState<FilterValues>(() => parseFiltersFromUrl(searchParams));
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage]         = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  const pushUrl = useCallback(
    (next: FilterValues) => {
      const sp = new URLSearchParams();
      if (next.keyword)  sp.set("keyword",  next.keyword);
      if (next.category) sp.set("category", next.category);
      if (next.minPrice) sp.set("minPrice", next.minPrice);
      if (next.maxPrice) sp.set("maxPrice", next.maxPrice);
      if (next.status !== "active") sp.set("status", next.status);
      if (next.sort   !== "newest") sp.set("sort",   next.sort);
      const qs = sp.toString();
      router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
    },
    [router]
  );

  const doFetch = useCallback(
    (f: FilterValues, nextPage: number, append: boolean): Promise<void> => {
      const hasSearchFilters = !!f.keyword || !!f.category || !!f.minPrice || !!f.maxPrice;

      const fetchFn = hasSearchFilters
        ? listingsApi.search({
            keyword:  f.keyword  || undefined,
            category: f.category || undefined,
            minPrice: f.minPrice ? Number(f.minPrice) : undefined,
            maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
            page:     nextPage,
            size:     PAGE_SIZE,
          })
        : f.status === "active"
        ? listingsApi.getActive(nextPage, PAGE_SIZE)
        : listingsApi.getAll(nextPage, PAGE_SIZE);

      return fetchFn.then((res) => {
        const items  = res.content ?? [];
        const active = filterByStatus(items, f.status);
        const sorted = sortListings(active, f.sort);
        setListings((prev) => (append ? [...prev, ...sorted] : sorted));
        setHasMore(!res.last);
        setPage(nextPage);
      });
    },
    []
  );

  useEffect(() => {
    doFetch(filters, 0, false).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (next: Partial<FilterValues>) => {
      const updated = { ...filters, ...next };
      setFilters(updated);
      pushUrl(updated);

      if ("sort" in next) {
        setListings((prev) => sortListings(prev, updated.sort));
        return;
      }

      setLoading(true);
      setPage(0);
      doFetch(updated, 0, false).finally(() => setLoading(false));
    },
    [filters, pushUrl, doFetch]
  );

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setLoading(true);
    setPage(0);
    router.replace("/catalog", { scroll: false });
    doFetch(DEFAULT_FILTERS, 0, false).finally(() => setLoading(false));
  }, [router, doFetch]);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    doFetch(filters, page + 1, true).finally(() => setLoadingMore(false));
  }, [doFetch, filters, page]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ────────────────────────────────────────────── */}
        <div className="mb-10">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-600">Beranda</Link>
            <span>/</span>
            <span className="text-slate-600">Katalog</span>
          </nav>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            Semua karya
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Katalog Lelang
          </h1>
        </div>

        <div className="flex gap-8">

          {/* ── Desktop sidebar ──────────────────────────────────────── */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <ListingFilters
                values={filters}
                onChange={handleChange}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* ── Main column ──────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">

            {/* Top bar: result count + mobile filter trigger */}
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {loading ? "Memuat…" : `${listings.length} karya ditemukan`}
              </p>
              <button
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  {listings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                  {loadingMore &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <ListingCardSkeleton key={`more-${i}`} />
                    ))}
                </div>

                {hasMore && !loadingMore && (
                  <div className="mt-10 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="rounded-xl border border-slate-200 bg-white px-8 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      Muat lebih banyak
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={closeDrawer}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white px-5 pb-8 pt-4 animate-slide-up">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Filter &amp; Urutan</h2>
              <button
                onClick={closeDrawer}
                className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ListingFilters
              values={filters}
              onChange={(next) => { handleChange(next); }}
              onReset={() => { handleReset(); closeDrawer(); }}
            />
            <button
              onClick={closeDrawer}
              className="mt-6 w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
