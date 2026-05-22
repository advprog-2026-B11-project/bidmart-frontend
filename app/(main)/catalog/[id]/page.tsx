"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Gavel,
  RefreshCw,
} from "lucide-react";
import { ListingImageGallery } from "@/components/features/listings/ListingImageGallery";
import { BidHistory } from "@/components/features/listings/BidHistory";
import { SellerInfoCard } from "@/components/features/listings/SellerInfoCard";
import { CountdownTimer } from "@/components/features/listings/CountdownTimer";
import { BidForm } from "@/components/features/bidding/BidForm";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatRupiah } from "@/lib/utils";
import { AuctionStatus, NotificationType } from "@/constants/enums";
import * as listingsApi from "@/lib/api/listings";
import * as bidsApi from "@/lib/api/bids";
import type { Listing, Notification } from "@/types/api";

/* ─── Status config ─────────────────────────────────────────────────────── */

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default"; pulse?: boolean }
> = {
  ACTIVE:    { label: "Aktif",        variant: "success"               },
  EXTENDED:  { label: "Diperpanjang", variant: "warning", pulse: true  },
  ENDED:     { label: "Berakhir",     variant: "default"               },
  SOLD:      { label: "Terjual",      variant: "info"                  },
  DRAFT:     { label: "Draft",        variant: "default"               },
  CANCELLED: { label: "Dibatalkan",   variant: "danger"                },
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex gap-2">
          {[60, 48, 80, 120].map((w) => (
            <Skeleton key={w} className="h-4 rounded" style={{ width: w }} />
          ))}
        </div>
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-5">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-9 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Polling interval ───────────────────────────────────────────────────── */

const POLL_INTERVAL_MS = 8_000;

/* ─── Listing notification types ────────────────────────────────────────── */

const LISTING_NOTIFICATION_TYPES: string[] = [
  NotificationType.BID_PLACED,
  NotificationType.BID_OUTBID,
  NotificationType.AUCTION_ENDED,
];

/* ─── Detail Page ─────────────────────────────────────────────────────────── */

export default function ListingDetailPage() {
  const params = useParams();
  const id     = params.id as string;

  const [listing,     setListing]     = useState<Listing | null>(null);
  const [minimumBid,  setMinimumBid]  = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyKey,  setHistoryKey]  = useState(0);

  const { isAuthenticated } = useAuth();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch listing + minimum bid ── */

  const doFetch = useCallback((): Promise<void> => {
    return listingsApi
      .getById(id)
      .then((l) => {
        setListing(l);
        setError(null);
      })
      .catch((err) => {
        console.error("[ListingDetail] fetch failed:", err);
        const msg = err?.message ?? "Gagal memuat karya";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fetchMinimumBid = useCallback(() => {
    if (!isAuthenticated) return;
    bidsApi.getMinimumBid(id).then((res) => setMinimumBid(res.minimumBid)).catch(() => {});
  }, [id, isAuthenticated]);

  const refetchAll = useCallback(() => {
    doFetch();
    fetchMinimumBid();
    setHistoryKey((k) => k + 1);
  }, [doFetch, fetchMinimumBid]);

  /* Initial load */
  useEffect(() => {
    doFetch();
  }, [doFetch]);

  /* Fetch minimum bid when listing is active + authenticated */
  useEffect(() => {
    if (!listing) return;
    const isActive =
      listing.status === AuctionStatus.ACTIVE ||
      listing.status === AuctionStatus.EXTENDED;
    if (!isActive || !isAuthenticated) return;
    fetchMinimumBid();
  }, [listing, isAuthenticated, fetchMinimumBid]);

  /* ── Polling: every 8 s while tab is visible ── */

  useEffect(() => {
    if (!listing) return;
    const isActive =
      listing.status === AuctionStatus.ACTIVE ||
      listing.status === AuctionStatus.EXTENDED;
    if (!isActive) return;

    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") refetchAll();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [listing, refetchAll]);

  /* ── WebSocket notification listener ── */

  useEffect(() => {
    function onWsNotification(e: Event) {
      const notification = (e as CustomEvent<Notification>).detail;
      if (
        notification.referenceId === id &&
        LISTING_NOTIFICATION_TYPES.includes(notification.type)
      ) {
        refetchAll();
      }
    }
    window.addEventListener("ws-notification", onWsNotification);
    return () => window.removeEventListener("ws-notification", onWsNotification);
  }, [id, refetchAll]);

  /* ── Bid success handler ── */

  const handleBidSuccess = useCallback(() => refetchAll(), [refetchAll]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setListing(null);
    doFetch();
  }, [doFetch]);

  /* ── Render ── */

  if (loading) return <DetailSkeleton />;

  if (error || !listing) {
    return (
      <div className="bg-white">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Gavel className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-700">Karya tidak dapat dimuat</p>
            <p className="mt-1 text-sm text-slate-400">
              Karya mungkin sudah dihapus atau terjadi kesalahan koneksi.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
          <Link
            href="/catalog"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            Kembali ke katalog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[listing.status] ?? { label: listing.status, variant: "default" as const };
  const isClosed   = listing.status === AuctionStatus.ENDED || listing.status === AuctionStatus.SOLD;
  const isActive   = listing.status === AuctionStatus.ACTIVE || listing.status === AuctionStatus.EXTENDED;
  const price      = listing.totalBids > 0 ? listing.currentPrice : listing.startingPrice;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="transition-colors hover:text-slate-600">Beranda</Link>
          <ArrowRight className="h-3 w-3" />
          <Link href="/catalog" className="transition-colors hover:text-slate-600">Katalog</Link>
          <ArrowRight className="h-3 w-3" />
          <Link
            href={`/catalog?category=${listing.category?.id || listing.categoryId}`}
            className="transition-colors hover:text-slate-600"
          >
            {listing.category?.name || "Kategori"}
          </Link>
          <ArrowRight className="h-3 w-3" />
          <span className="max-w-50 truncate text-slate-600">{listing.title}</span>
        </nav>

        {/* Closed banner */}
        {isClosed && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-semibold text-slate-700">
              Lelang berakhir
              {listing.status === AuctionStatus.SOLD && (
                <span className="ml-1 font-normal text-slate-500">
                  — Lelang telah dimenangkan.
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">

          {/* ── Left: image gallery + description ────────────────────── */}
          <div>
            <ListingImageGallery imageUrls={listing.imageUrls} title={listing.title} />

            <div className="mt-10">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Deskripsi
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                {listing.description
                  ? listing.description.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))
                  : <p className="italic text-slate-400">Tidak ada deskripsi.</p>
                }
              </div>
            </div>
          </div>

          {/* ── Right: sticky panel ──────────────────────────────────── */}
          <div>
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Status badge + category */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={statusInfo.variant}
                  className={statusInfo.pulse ? "animate-pulse" : undefined}
                >
                  {statusInfo.label}
                </Badge>
                {listing.category?.name && listing.category.name !== "Kategori" && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {listing.category.name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
                {listing.title}
              </h1>

              {/* Seller */}
              {listing.seller && <SellerInfoCard seller={listing.seller} />}

              {/* Price block */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {listing.totalBids > 0 ? "Penawaran tertinggi" : "Harga awal"}
                </p>
                <p
                  className={`font-serif text-4xl font-bold tabular-nums tracking-tight ${
                    isActive ? "text-yellow-500" : "text-slate-800"
                  }`}
                >
                  {formatRupiah(price)}
                </p>
                {listing.totalBids > 0 && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    {listing.totalBids} penawaran masuk
                  </p>
                )}
              </div>

              {/* Countdown */}
              {isActive && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                  <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">
                      Berakhir dalam
                    </p>
                    <CountdownTimer endTime={listing.endAt} className="text-base font-semibold text-blue-700" />
                  </div>
                </div>
              )}

              {/* Bid form */}
              <BidForm
                listing={listing}
                minimumBid={minimumBid}
                onBidSuccess={handleBidSuccess}
              />

              {/* Bid history accordion */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  onClick={() => setHistoryOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-slate-400" />
                    Riwayat Penawaran
                    {listing.totalBids > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {listing.totalBids}
                      </span>
                    )}
                  </span>
                  {historyOpen
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {historyOpen && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    <BidHistory key={historyKey} listingId={listing.id} />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
