"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit,
  Eye,
  Gavel,
  MoreVertical,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CountdownTimer } from "@/components/features/listings/CountdownTimer";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatRupiah } from "@/lib/utils";
import { AuctionStatus } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import * as listingsApi from "@/lib/api/listings";
import type { Listing } from "@/types/api";

/* ─── Types & helpers ─────────────────────────────────────────────────────── */

type ListingTab = "aktif" | "draft" | "selesai";

const TABS: { key: ListingTab; label: string }[] = [
  { key: "aktif",   label: "Aktif" },
  { key: "draft",   label: "Draft" },
  { key: "selesai", label: "Selesai" },
];

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: "success" | "warning" | "danger" | "info" | "default";
}> = {
  ACTIVE:    { label: "Aktif",        variant: "success" },
  EXTENDED:  { label: "Diperpanjang", variant: "warning" },
  DRAFT:     { label: "Draft",        variant: "default" },
  ENDED:     { label: "Berakhir",     variant: "default" },
  SOLD:      { label: "Terjual",      variant: "info"    },
  CANCELLED: { label: "Dibatalkan",   variant: "danger"  },
};

function tabMatch(l: Listing, tab: ListingTab): boolean {
  const s = l.status;
  if (tab === "aktif")   return s === AuctionStatus.ACTIVE || s === AuctionStatus.EXTENDED;
  if (tab === "draft")   return s === AuctionStatus.DRAFT;
  if (tab === "selesai") return s === AuctionStatus.ENDED || s === AuctionStatus.SOLD || s === AuctionStatus.CANCELLED;
  return true;
}

function isEditable(status: string): boolean {
  return status !== AuctionStatus.ACTIVE && status !== AuctionStatus.EXTENDED;
}

/* ─── Row skeleton ────────────────────────────────────────────────────────── */

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState({ tab }: { tab: ListingTab }) {
  const msgs: Record<ListingTab, string> = {
    aktif:   "Belum ada listing aktif.",
    draft:   "Belum ada draft listing.",
    selesai: "Belum ada listing yang selesai.",
  };
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Package className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-slate-700">
        {msgs[tab]}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        Buat listing pertama Anda dan mulai lelang karya seni Anda di BidMart.
      </p>
      <Link
        href={ROUTES.CREATE_LISTING}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        <Plus className="h-4 w-4" />
        Buat listing pertama
      </Link>
    </div>
  );
}

/* ─── Action menu ─────────────────────────────────────────────────────────── */

interface ActionMenuProps {
  listing: Listing;
  onDelete: (id: string) => void;
}

function ActionMenu({ listing, onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const editable = isEditable(listing.status);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setConfirmDelete(false); }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* View */}
          <Link
            href={ROUTES.LISTING_DETAIL(listing.id)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Eye className="h-4 w-4 text-slate-400" />
            Lihat
          </Link>

          {/* Edit */}
          {editable ? (
            <Link
              href={ROUTES.EDIT_LISTING(listing.id)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Edit className="h-4 w-4 text-slate-400" />
              Edit
            </Link>
          ) : (
            <span className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 cursor-not-allowed">
              <Edit className="h-4 w-4" />
              Edit
            </span>
          )}

          {/* Delete */}
          {editable && (
            <>
              <div className="border-t border-slate-100" />
              {confirmDelete ? (
                <button
                  type="button"
                  onClick={() => { onDelete(listing.id); setOpen(false); setConfirmDelete(false); }}
                  className="flex w-full items-center gap-2.5 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Konfirmasi Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Listing row ─────────────────────────────────────────────────────────── */

interface ListingRowProps {
  listing: Listing;
  onDelete: (id: string) => void;
}

function ListingRow({ listing, onDelete }: ListingRowProps) {
  const thumb = listing.imageUrls[0];
  const statusConf = STATUS_CONFIG[listing.status] ?? { label: listing.status, variant: "default" as const };
  const isActive = listing.status === AuctionStatus.ACTIVE || listing.status === AuctionStatus.EXTENDED;
  const highestBid = listing.totalBids > 0 ? listing.currentPrice : null;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-shadow hover:border-slate-200 hover:shadow-sm">
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        {thumb ? (
          <Image src={thumb} alt={listing.title} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-6 w-6 text-slate-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{listing.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {highestBid !== null ? (
            <p className="text-xs text-slate-500">
              Bid tertinggi:{" "}
              <span className="font-semibold tabular-nums text-blue-700">
                {formatRupiah(highestBid)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">Belum ada penawaran</p>
          )}
          {isActive && (
            <CountdownTimer endTime={listing.endAt} />
          )}
        </div>
      </div>

      {/* Status badge */}
      <Badge variant={statusConf.variant} className="shrink-0">
        {statusConf.label}
      </Badge>

      {/* Action menu */}
      <ActionMenu listing={listing} onDelete={onDelete} />
    </div>
  );
}

/* ─── Main content ────────────────────────────────────────────────────────── */

function MyListingsContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [tab,      setTab]      = useState<ListingTab>("aktif");
  const [page,     setPage]     = useState(0);
  const [hasMore,  setHasMore]  = useState(false);

  const doFetch = useCallback((p = 0): Promise<void> => {
    return listingsApi
      .getAll(p, 50)
      .then((res) => {
        setListings((prev) => {
          const all = p === 0 ? res.content : [...prev, ...res.content];
          return all;
        });
        setHasMore(!res.last);
        setPage(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    doFetch(0);
  }, [doFetch]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await listingsApi.deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing berhasil dihapus.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus listing.";
      toast.error(msg);
    }
  }, []);

  /* Filter by user ownership + tab */
  const filtered = listings.filter(
    (l) => user && l.seller.id === user.id && tabMatch(l, tab)
  );

  /* Counts per tab (owned by user) */
  const owned = user ? listings.filter((l) => l.seller.id === user.id) : [];
  const counts: Record<ListingTab, number> = {
    aktif:   owned.filter((l) => l.status === AuctionStatus.ACTIVE || l.status === AuctionStatus.EXTENDED).length,
    draft:   owned.filter((l) => l.status === AuctionStatus.DRAFT).length,
    selesai: owned.filter((l) => l.status === AuctionStatus.ENDED || l.status === AuctionStatus.SOLD || l.status === AuctionStatus.CANCELLED).length,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Listing Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola semua karya yang Anda lelang di BidMart.
          </p>
        </div>
        <Link
          href={ROUTES.CREATE_LISTING}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Buat Listing Baru
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-150",
              tab === key
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
            {counts[key] > 0 && (
              <span className={cn(
                "inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                tab === key ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
              )}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">Gagal memuat listing.</p>
          <button
            onClick={() => { setLoading(true); setError(false); doFetch(0); }}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Coba lagi
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <ListingRow key={l.id} listing={l} onDelete={handleDelete} />
          ))}

          {hasMore && (
            <button
              onClick={() => { setLoading(true); doFetch(page + 1); }}
              className="mt-2 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Muat lebih banyak
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function MyListingsPage() {
  return (
    <AuthGuard mode="auth-required">
      <MyListingsContent />
    </AuthGuard>
  );
}
