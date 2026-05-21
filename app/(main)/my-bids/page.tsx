"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gavel, Trophy } from "lucide-react";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatRupiah, formatRelativeTime } from "@/lib/utils";
import { AuctionStatus } from "@/constants/enums";
import * as bidsApi from "@/lib/api/bids";
import type { Bid } from "@/types/api";

/* ─── Status derivation ──────────────────────────────────────────────────── */

type BidStatus = "aktif" | "menang" | "kalah" | "tutup";

function deriveBidStatus(bid: Bid, userId: string): BidStatus {
  const listing = bid.listing;
  if (!listing) return "tutup";

  const { status } = listing;
  const isHighest =
    listing.currentHighestBidderId === userId ||
    bid.isWinning;

  if (status === AuctionStatus.ACTIVE || status === AuctionStatus.EXTENDED) {
    return isHighest ? "aktif" : "kalah";
  }
  if (status === AuctionStatus.ENDED || status === AuctionStatus.SOLD) {
    return isHighest ? "menang" : "kalah";
  }
  return "tutup";
}

const statusDisplay: Record<
  BidStatus,
  { label: string; variant: "success" | "warning" | "danger" | "default" }
> = {
  aktif:  { label: "Tertinggi", variant: "success" },
  menang: { label: "Menang 🏆", variant: "success" },
  kalah:  { label: "Dikalahkan", variant: "danger" },
  tutup:  { label: "Ditutup",   variant: "default" },
};

/* ─── Filter tabs ─────────────────────────────────────────────────────────── */

type FilterTab = "semua" | "aktif" | "menang" | "kalah";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "semua",  label: "Semua" },
  { key: "aktif",  label: "Aktif" },
  { key: "menang", label: "Menang" },
  { key: "kalah",  label: "Kalah" },
];

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function BidRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Gavel className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-slate-700">
        Belum ada penawaran
      </h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        Anda belum pernah memasang penawaran. Mulai jelajahi lelang dan ikut bidding sekarang!
      </p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        <Gavel className="h-4 w-4" />
        Jelajahi Lelang
      </Link>
    </div>
  );
}

/* ─── Bid row ─────────────────────────────────────────────────────────────── */

interface BidRowProps {
  bid: Bid;
  bidStatus: BidStatus;
}

function BidRow({ bid, bidStatus }: BidRowProps) {
  const listing = bid.listing;
  const { label, variant } = statusDisplay[bidStatus];
  const thumb = listing?.imageUrls?.[0];

  return (
    <Link
      href={listing ? `/catalog/${listing.id}` : "#"}
      className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-shadow hover:border-slate-200 hover:shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        {thumb ? (
          <Image
            src={thumb}
            alt={listing?.title ?? "Karya"}
            fill
            sizes="64px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gavel className="h-6 w-6 text-slate-300" />
          </div>
        )}
        {bidStatus === "menang" && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
            <Trophy className="h-5 w-5 text-emerald-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {listing?.title ?? `Listing #${bid.listingId}`}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Bid Anda:{" "}
          <span className="font-semibold tabular-nums text-slate-700">
            {formatRupiah(bid.amount)}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {formatRelativeTime(bid.createdAt)}
        </p>
      </div>

      {/* Status */}
      <Badge variant={variant} className="shrink-0">
        {label}
      </Badge>
    </Link>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

function MyBidsContent() {
  const { user } = useAuth();
  const [bids,    setBids]    = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [tab,     setTab]     = useState<FilterTab>("semua");

  const doFetch = useCallback((): Promise<void> => {
    return bidsApi
      .getMyBids()
      .then((res) => {
        setBids(res ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  /* Filtered list */
  const filtered = bids.filter((bid) => {
    if (!user) return true;
    if (tab === "semua") return true;
    const st = deriveBidStatus(bid, user.id);
    if (tab === "aktif")  return st === "aktif";
    if (tab === "menang") return st === "menang";
    if (tab === "kalah")  return st === "kalah";
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
          Penawaran Saya
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Riwayat semua penawaran yang pernah Anda pasang.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150",
              tab === key
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <BidRowSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">Gagal memuat data penawaran.</p>
          <button
            onClick={() => { setLoading(true); setError(false); doFetch(); }}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      ) : filtered.length === 0 ? (
        bids.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">
              Tidak ada penawaran dengan status ini.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {filtered.map((bid) => (
            <BidRow
              key={bid.id}
              bid={bid}
              bidStatus={user ? deriveBidStatus(bid, user.id) : "tutup"}
            />
          ))}

        </div>
      )}
    </div>
  );
}

export default function MyBidsPage() {
  return (
    <AuthGuard mode="auth-required">
      <MyBidsContent />
    </AuthGuard>
  );
}
