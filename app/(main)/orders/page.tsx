"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDateTime, formatRupiah } from "@/lib/utils";
import { OrderStatus } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import * as ordersApi from "@/lib/api/orders";
import type { Order } from "@/types/api";

/* ─── Tabs ────────────────────────────────────────────────────────────────── */

type OrderTab = "semua" | "menunggu" | "dikirim" | "selesai" | "dibatalkan";

const TABS: { key: OrderTab; label: string }[] = [
  { key: "semua",      label: "Semua" },
  { key: "menunggu",   label: "Menunggu Pengiriman" },
  { key: "dikirim",    label: "Dikirim" },
  { key: "selesai",    label: "Selesai" },
  { key: "dibatalkan", label: "Dibatalkan" },
];

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: "success" | "warning" | "danger" | "info" | "default";
}> = {
  PENDING:   { label: "Menunggu Pembayaran", variant: "warning"  },
  PAID:      { label: "Dibayar",             variant: "info"     },
  SHIPPED:   { label: "Dikirim",             variant: "info"     },
  DELIVERED: { label: "Diterima",            variant: "success"  },
  COMPLETED: { label: "Selesai",             variant: "success"  },
  CANCELLED: { label: "Dibatalkan",          variant: "danger"   },
  REFUNDED:  { label: "Dikembalikan",        variant: "default"  },
};

function tabMatch(o: Order, tab: OrderTab): boolean {
  if (tab === "semua") return true;
  const s = o.status;
  if (tab === "menunggu")   return s === OrderStatus.PENDING || s === OrderStatus.PAID;
  if (tab === "dikirim")    return s === OrderStatus.SHIPPED;
  if (tab === "selesai")    return s === OrderStatus.DELIVERED || s === OrderStatus.COMPLETED;
  if (tab === "dibatalkan") return s === OrderStatus.CANCELLED || s === OrderStatus.REFUNDED;
  return false;
}

/* ─── Skeletons ───────────────────────────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState({ tab }: { tab: OrderTab }) {
  const msgs: Record<OrderTab, string> = {
    semua:      "Belum ada order.",
    menunggu:   "Tidak ada order yang menunggu pengiriman.",
    dikirim:    "Tidak ada order yang sedang dikirim.",
    selesai:    "Belum ada order yang selesai.",
    dibatalkan: "Tidak ada order yang dibatalkan.",
  };
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <ShoppingBag className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-slate-700">{msgs[tab]}</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        Ikuti lelang dan menangkan item favorit Anda untuk melihat order di sini.
      </p>
    </div>
  );
}

/* ─── Order card ──────────────────────────────────────────────────────────── */

function OrderCard({ order }: { order: Order }) {
  const thumb = order.listing.imageUrls[0];
  const statusConf = STATUS_CONFIG[order.status] ?? { label: order.status, variant: "default" as const };

  return (
    <Link
      href={ROUTES.ORDER_DETAIL(order.id)}
      className="block rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          {thumb ? (
            <Image src={thumb} alt={order.listing.title} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-6 w-6 text-slate-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{order.listing.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            No. Order:{" "}
            <span className="font-mono font-medium text-slate-700">
              {order.id.slice(0, 8).toUpperCase()}
            </span>
          </p>
          <p className="mt-1 text-sm font-bold text-blue-700">{formatRupiah(order.finalPrice)}</p>
          {order.trackingNumber && (
            <p className="mt-0.5 text-xs text-slate-400">
              Resi:{" "}
              <span className="font-mono text-slate-600">{order.trackingNumber}</span>
            </p>
          )}
        </div>

        {/* Right: badge + date */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
          <p className="text-[10px] text-slate-400">{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* Status hint */}
      {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID) && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-700">Menunggu seller memproses pengiriman…</p>
        </div>
      )}
      {order.status === OrderStatus.SHIPPED && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-700">Paket sedang dalam perjalanan — klik untuk konfirmasi penerimaan</p>
          <span className="ml-2 shrink-0 text-xs font-semibold text-blue-700">→</span>
        </div>
      )}
    </Link>
  );
}

/* ─── Main content ────────────────────────────────────────────────────────── */

function OrdersContent() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [tab,     setTab]     = useState<OrderTab>("semua");
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const doFetch = useCallback((p = 0): Promise<void> => {
    return ordersApi
      .getByBuyer(p, 20)
      .then((res) => {
        setOrders((prev) => (p === 0 ? res.content : [...prev, ...res.content]));
        setHasMore(!res.last);
        setPage(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    doFetch(0);
  }, [doFetch]);

  const filtered = orders.filter((o) => tabMatch(o, tab));

  const counts: Record<OrderTab, number> = {
    semua:      orders.length,
    menunggu:   orders.filter((o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.PAID).length,
    dikirim:    orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
    selesai:    orders.filter((o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.COMPLETED).length,
    dibatalkan: orders.filter((o) => o.status === OrderStatus.CANCELLED || o.status === OrderStatus.REFUNDED).length,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-serif text-3xl font-bold tracking-tight text-slate-900">
        Pesanan Saya
      </h1>

      {/* Tabs */}
      <div className="mb-6 -mx-0.5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-150",
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
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">Gagal memuat pesanan.</p>
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
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
          {hasMore && tab === "semua" && (
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

export default function OrdersPage() {
  return (
    <AuthGuard mode="auth-required">
      <OrdersContent />
    </AuthGuard>
  );
}
