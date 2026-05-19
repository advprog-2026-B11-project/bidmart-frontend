"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Gavel,
  LogIn,
  TrendingUp,
} from "lucide-react";
import { ListingImageGallery } from "@/components/features/listings/ListingImageGallery";
import { BidHistory } from "@/components/features/listings/BidHistory";
import { SellerInfoCard } from "@/components/features/listings/SellerInfoCard";
import { CountdownTimer } from "@/components/features/listings/CountdownTimer";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatRupiah } from "@/lib/utils";
import { AuctionStatus } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import * as listingsApi from "@/lib/api/listings";
import * as bidsApi from "@/lib/api/bids";
import type { Listing } from "@/types/api";

/* ─── Status config ─────────────────────────────────────────────────────── */

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default"; pulse?: boolean }
> = {
  ACTIVE:    { label: "Aktif",       variant: "success"                },
  EXTENDED:  { label: "Diperpanjang", variant: "warning", pulse: true  },
  ENDED:     { label: "Berakhir",    variant: "default"                },
  SOLD:      { label: "Terjual",     variant: "info"                   },
  DRAFT:     { label: "Draft",       variant: "default"                },
  CANCELLED: { label: "Dibatalkan",  variant: "danger"                 },
};

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex gap-2">
        {[60, 48, 80, 120].map((w) => (
          <Skeleton key={w} className="h-4 rounded" style={{ width: w }} />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Image */}
        <Skeleton className="aspect-square w-full rounded-xl" />
        {/* Panel */}
        <div className="space-y-5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ─── Bid Form Placeholder ───────────────────────────────────────────────── */

interface BidFormProps {
  listing: Listing;
  minimumBid: number | null;
}

function BidFormPlaceholder({ listing, minimumBid }: BidFormProps) {
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState("");

  if (!isAuthenticated) {
    return (
      <Link
        href={`${ROUTES.AUTH.LOGIN}?next=/catalog/${listing.id}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <LogIn className="h-4 w-4" />
        Login untuk memasang bid
      </Link>
    );
  }

  if (listing.status !== AuctionStatus.ACTIVE) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-sm text-slate-400">
        Lelang ini sudah berakhir.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {minimumBid !== null && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          Min. bid berikutnya:{" "}
          <span className="font-semibold tabular-nums text-blue-700">
            {formatRupiah(minimumBid)}
          </span>
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={minimumBid ? String(minimumBid) : "Jumlah bid…"}
          min={minimumBid ?? 0}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          disabled
          title="Bidding akan tersedia di Stage 6"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60 cursor-not-allowed"
        >
          <Gavel className="h-4 w-4" />
          Bid
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        Fitur bidding akan aktif di tahap berikutnya.
      </p>
    </div>
  );
}

/* ─── Detail Page ─────────────────────────────────────────────────────────── */

export default function ListingDetailPage() {
  const params = useParams();
  const id     = params.id as string;

  const [listing,    setListing]    = useState<Listing | null>(null);
  const [minimumBid, setMinimumBid] = useState<number | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  const doFetch = useCallback((): Promise<void> => {
    return listingsApi
      .getById(id)
      .then((l) => setListing(l))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setListing(null);
    doFetch();
  }, [doFetch]);

  /* Fetch minimum bid for active listings when authenticated */
  useEffect(() => {
    if (!listing || listing.status !== AuctionStatus.ACTIVE || !isAuthenticated) return;
    bidsApi.getMinimumBid(id).then((res) => setMinimumBid(res.minimumBid)).catch(() => {});
  }, [listing, id, isAuthenticated]);

  if (loading)  return <DetailSkeleton />;
  if (error || !listing) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-500">Gagal memuat karya.</p>
        <button
          onClick={handleRetry}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const statusInfo = statusConfig[listing.status] ?? { label: listing.status, variant: "default" as const };
  const isClosed   = listing.status === AuctionStatus.ENDED || listing.status === AuctionStatus.SOLD;
  const price      = listing.totalBids > 0 ? listing.currentPrice : listing.startingPrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600">Beranda</Link>
        <ArrowRight className="h-3 w-3" />
        <Link href="/catalog" className="hover:text-slate-600">Katalog</Link>
        <ArrowRight className="h-3 w-3" />
        <Link
          href={`/catalog?category=${listing.category.id}`}
          className="hover:text-slate-600"
        >
          {listing.category.name}
        </Link>
        <ArrowRight className="h-3 w-3" />
        <span className="max-w-45 truncate text-slate-600">{listing.title}</span>
      </nav>

      {/* Closed banner */}
      {isClosed && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
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

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">

        {/* ── Left: image gallery ───────────────────────────────────────── */}
        <div>
          <ListingImageGallery
            imageUrls={listing.imageUrls}
            title={listing.title}
          />

          {/* Description */}
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Deskripsi
            </h2>
            <div className="prose prose-sm max-w-none text-slate-700">
              {listing.description.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: sticky panel ──────────────────────────────────────── */}
        <div>
          <div className="lg:sticky lg:top-24 space-y-5">

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant={statusInfo.variant}
                className={statusInfo.pulse ? "animate-pulse" : undefined}
              >
                {statusInfo.label}
              </Badge>
              <span className="text-xs text-slate-400">{listing.category.name}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl">
              {listing.title}
            </h1>

            {/* Seller */}
            <SellerInfoCard seller={listing.seller} />

            {/* Price block */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {listing.totalBids > 0 ? "Penawaran tertinggi" : "Harga awal"}
              </p>
              <p
                className={`font-serif text-3xl font-bold tabular-nums ${
                  listing.status === AuctionStatus.ACTIVE ? "text-yellow-500" : "text-slate-800"
                }`}
              >
                {formatRupiah(price)}
              </p>
              {listing.totalBids > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  {listing.totalBids} penawaran masuk
                </p>
              )}
            </div>

            {/* Countdown */}
            {listing.status === AuctionStatus.ACTIVE && (
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">
                    Berakhir dalam
                  </p>
                  <CountdownTimer endTime={listing.endAt} className="text-base font-semibold" />
                </div>
              </div>
            )}

            {/* Bid form */}
            <BidFormPlaceholder listing={listing} minimumBid={minimumBid} />

            {/* Bid history accordion */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setHistoryOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-slate-800"
              >
                <span className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-slate-400" />
                  Riwayat Penawaran
                  {listing.totalBids > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
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
                  <BidHistory listingId={listing.id} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
