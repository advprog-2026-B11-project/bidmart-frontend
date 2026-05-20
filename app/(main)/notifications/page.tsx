"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronDown,
  Clock,
  Gavel,
  Package,
  Settings,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NotificationType } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import * as notificationsApi from "@/lib/api/notifications";
import type { Notification } from "@/types/api";

/* ─── Notification icon & color per type ─────────────────────────────────── */

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  label: string;
}> = {
  [NotificationType.BID_PLACED]:      { icon: <Gavel className="h-4 w-4" />,        color: "text-blue-600 bg-blue-100",    label: "Bid Masuk"       },
  [NotificationType.BID_OUTBID]:      { icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600 bg-amber-100",  label: "Tertinggi Kalah" },
  [NotificationType.AUCTION_WON]:     { icon: <Trophy className="h-4 w-4" />,        color: "text-emerald-600 bg-emerald-100", label: "Lelang Menang" },
  [NotificationType.AUCTION_ENDED]:   { icon: <Clock className="h-4 w-4" />,         color: "text-slate-600 bg-slate-100",  label: "Lelang Selesai"  },
  [NotificationType.ORDER_UPDATE]:    { icon: <Package className="h-4 w-4" />,       color: "text-violet-600 bg-violet-100", label: "Update Pesanan" },
  [NotificationType.PAYMENT_SUCCESS]: { icon: <CheckCircle className="h-4 w-4" />,   color: "text-emerald-600 bg-emerald-100", label: "Pembayaran"   },
  [NotificationType.SYSTEM]:          { icon: <Bell className="h-4 w-4" />,           color: "text-slate-500 bg-slate-100",  label: "Sistem"          },
};

function notifHref(n: Notification): string | null {
  switch (n.type) {
    case NotificationType.BID_PLACED:
    case NotificationType.BID_OUTBID:
    case NotificationType.AUCTION_WON:
    case NotificationType.AUCTION_ENDED:
      return n.referenceId ? ROUTES.LISTING_DETAIL(n.referenceId) : null;
    case NotificationType.ORDER_UPDATE:
      return n.referenceId ? ROUTES.ORDER_DETAIL(n.referenceId) : null;
    case NotificationType.PAYMENT_SUCCESS:
      return ROUTES.WALLET;
    default:
      return null;
  }
}

/* ─── Type filter dropdown ────────────────────────────────────────────────── */

const ALL_TYPES = Object.keys(TYPE_CONFIG) as (keyof typeof TYPE_CONFIG)[];

interface TypeFilterProps {
  selected: string[];
  onChange: (types: string[]) => void;
}

function TypeFilter({ selected, onChange }: TypeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleType = (type: string) => {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type]
    );
  };

  const label = selected.length === 0
    ? "Semua tipe"
    : selected.length === 1
      ? (TYPE_CONFIG[selected[0]]?.label ?? selected[0])
      : `${selected.length} tipe dipilih`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-20 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button
            onClick={() => { onChange([]); setOpen(false); }}
            className="flex w-full items-center px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Semua tipe
          </button>
          <div className="border-t border-slate-100" />
          {ALL_TYPES.map((type) => {
            const conf = TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", conf.color)}>
                  {conf.icon}
                </span>
                <span className="flex-1 text-left">{conf.label}</span>
                {selected.includes(type) && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Notification row ────────────────────────────────────────────────────── */

interface NotifRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotifRow({ notification: n, onMarkRead }: NotifRowProps) {
  const router = useRouter();
  const conf = TYPE_CONFIG[n.type] ?? TYPE_CONFIG[NotificationType.SYSTEM];
  const href = notifHref(n);

  const handleClick = () => {
    if (!n.read) {
      notificationsApi.markRead(n.id).catch(() => {});
      onMarkRead(n.id);
    }
    if (href) router.push(href);
  };

  return (
    <div
      role={href ? "button" : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => { if (e.key === "Enter") handleClick(); } : undefined}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 px-5 py-4 transition-colors",
        href && "cursor-pointer hover:bg-slate-50",
        !n.read && "bg-blue-50/40"
      )}
    >
      {/* Icon */}
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", conf.color)}>
        {conf.icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", n.read ? "text-slate-700" : "font-semibold text-slate-900")}>
          {n.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
        <p className="mt-1 text-[10px] text-slate-400">{formatRelativeTime(n.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function NotifSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-2 w-1/4 rounded" />
      </div>
    </div>
  );
}

/* ─── Main content ────────────────────────────────────────────────────────── */

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [page,     setPage]     = useState(0);
  const [hasMore,  setHasMore]  = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const doFetch = useCallback((p = 0): Promise<void> => {
    return notificationsApi
      .getByUser(p, 20)
      .then((res) => {
        setNotifications((prev) => (p === 0 ? res.content : [...prev, ...res.content]));
        setHasMore(!res.last);
        setPage(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    doFetch(0);
  }, [doFetch]);

  /* Listen for real-time notifications */
  useEffect(() => {
    function handler(e: Event) {
      const n = (e as CustomEvent<Notification>).detail;
      setNotifications((prev) => [n, ...prev]);
    }
    window.addEventListener("ws-notification", handler);
    return () => window.removeEventListener("ws-notification", handler);
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Semua notifikasi ditandai telah dibaca.");
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (typeFilter.length > 0 && !typeFilter.includes(n.type)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Notifikasi
          </h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {unreadCount} belum dibaca
            </p>
          )}
        </div>
        <Link
          href={ROUTES.NOTIFICATION_PREFERENCES}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
          Pengaturan
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <div
              onClick={() => setUnreadOnly((v) => !v)}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                unreadOnly ? "bg-blue-600" : "bg-slate-200"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                unreadOnly ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-sm text-slate-600">Belum dibaca</span>
          </label>

          <TypeFilter selected={typeFilter} onChange={setTypeFilter} />
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => <NotifSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">Gagal memuat notifikasi.</p>
            <button
              onClick={() => { setLoading(true); setError(false); doFetch(0); }}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {unreadOnly ? "Tidak ada notifikasi yang belum dibaca" : "Belum ada notifikasi"}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {filtered.map((n) => (
                <NotifRow key={n.id} notification={n} onMarkRead={handleMarkRead} />
              ))}
            </div>
            {hasMore && typeFilter.length === 0 && !unreadOnly && (
              <div className="border-t border-slate-100 px-5 py-3">
                <button
                  onClick={() => { setLoading(true); doFetch(page + 1); }}
                  className="w-full text-center text-sm font-medium text-blue-600 hover:underline"
                >
                  Muat lebih banyak
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function NotificationsPage() {
  return (
    <AuthGuard mode="auth-required">
      <NotificationsContent />
    </AuthGuard>
  );
}
