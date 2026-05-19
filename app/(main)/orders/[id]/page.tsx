"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Package,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDateTime, formatRupiah } from "@/lib/utils";
import { OrderStatus } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import * as ordersApi from "@/lib/api/orders";
import type { Order } from "@/types/api";

/* ─── Status config ───────────────────────────────────────────────────────── */

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

/* ─── Timeline ────────────────────────────────────────────────────────────── */

interface TimelineStep {
  label: string;
  sublabel?: string;
  done: boolean;
  active: boolean;
  icon: React.ReactNode;
}

function buildTimeline(order: Order): TimelineStep[] {
  const s = order.status;
  const isCancelled = s === OrderStatus.CANCELLED || s === OrderStatus.REFUNDED;

  if (isCancelled) {
    return [
      {
        label: "Pesanan Dibuat",
        sublabel: formatDateTime(order.createdAt),
        done: true,
        active: false,
        icon: <CheckCircle className="h-4 w-4" />,
      },
      {
        label: "Dibatalkan",
        sublabel: STATUS_CONFIG[s]?.label,
        done: true,
        active: true,
        icon: <X className="h-4 w-4" />,
      },
    ];
  }

  const paidDone      = s !== OrderStatus.PENDING;
  const shippedDone   = s === OrderStatus.SHIPPED || s === OrderStatus.DELIVERED || s === OrderStatus.COMPLETED;
  const deliveredDone = s === OrderStatus.DELIVERED || s === OrderStatus.COMPLETED;

  return [
    {
      label: "Pesanan Dibuat",
      sublabel: formatDateTime(order.createdAt),
      done: true,
      active: false,
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "Pembayaran Dikonfirmasi",
      sublabel: order.paidAt ? formatDateTime(order.paidAt) : undefined,
      done: paidDone,
      active: !paidDone,
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      label: "Barang Dikirim",
      sublabel: order.shippedAt ? formatDateTime(order.shippedAt) : undefined,
      done: shippedDone,
      active: paidDone && !shippedDone,
      icon: <Truck className="h-4 w-4" />,
    },
    {
      label: "Barang Diterima",
      sublabel: order.deliveredAt ? formatDateTime(order.deliveredAt) : undefined,
      done: deliveredDone,
      active: shippedDone && !deliveredDone,
      icon: <Check className="h-4 w-4" />,
    },
  ];
}

function OrderTimeline({ order }: { order: Order }) {
  const steps = buildTimeline(order);
  const isCancelled = order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Status Pesanan
      </p>
      <div className="relative">
        {/* Vertical connector */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="relative flex items-start gap-4">
              {/* Dot */}
              <div className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white transition-all",
                step.done && !step.active && !isCancelled && "bg-blue-600 text-white",
                step.active && !isCancelled && "bg-blue-600 text-white animate-pulse",
                step.active && isCancelled && "bg-red-500 text-white",
                step.done && step.active && isCancelled && "bg-red-500 text-white",
                !step.done && "bg-slate-100 text-slate-400",
              )}>
                {step.icon}
              </div>

              {/* Text */}
              <div className="pt-1">
                <p className={cn(
                  "text-sm font-semibold",
                  step.done ? "text-slate-900" : "text-slate-400"
                )}>
                  {step.label}
                </p>
                {step.sublabel && (
                  <p className="mt-0.5 text-xs text-slate-400">{step.sublabel}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm dialog ──────────────────────────────────────────────────────── */

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmDialog({ title, description, confirmLabel, confirmClass, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm scale-100 rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors",
              confirmClass ?? "bg-blue-700 hover:bg-blue-800"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dispute form ────────────────────────────────────────────────────────── */

interface DisputeDialogProps {
  onSubmit: (reason: string, description: string) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

const DISPUTE_REASONS = [
  "Barang tidak sesuai deskripsi",
  "Barang tidak diterima",
  "Barang rusak saat tiba",
  "Penipu / penipuan",
  "Lainnya",
];

function DisputeDialog({ onSubmit, onClose, submitting }: DisputeDialogProps) {
  const [reason,      setReason]      = useState(DISPUTE_REASONS[0]);
  const [description, setDescription] = useState("");
  const error = description.trim().length > 0 && description.trim().length < 20
    ? "Deskripsi minimal 20 karakter."
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md scale-100 rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Ajukan Sengketa</h3>
            <p className="text-xs text-slate-500">Tim BidMart akan meninjau dalam 1×24 jam</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Alasan sengketa
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {DISPUTE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Penjelasan detail{" "}
              <span className="text-slate-400 font-normal">(min. 20 karakter)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Jelaskan masalah yang Anda hadapi secara rinci…"
              className={cn(
                "w-full resize-none rounded-xl border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                error ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
              )}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={() => {
              if (description.trim().length < 20) return;
              onSubmit(reason, description.trim());
            }}
            disabled={submitting || description.trim().length < 20}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Mengirim…" : "Kirim Sengketa"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="h-5 w-36 rounded" />
      <Skeleton className="h-8 w-48 rounded" />
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ─── Order detail content ────────────────────────────────────────────────── */

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order,     setOrder]     = useState<Order | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showDispute,  setShowDispute]  = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    ordersApi
      .getById(id)
      .then(setOrder)
      .catch((err) => {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 404) setNotFound(true);
        else toast.error("Gagal memuat detail pesanan.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = useCallback(async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.confirm(order.id);
      setOrder(updated);
      setShowConfirm(false);
      toast.success("Penerimaan barang dikonfirmasi!");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal konfirmasi.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [order]);

  const handleDispute = useCallback(async (reason: string, description: string) => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.dispute(order.id, { reason, description });
      setOrder(updated);
      setShowDispute(false);
      toast.success("Sengketa berhasil diajukan. Tim kami akan meninjau dalam 1×24 jam.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengajukan sengketa.";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }, [order]);

  if (loading) return <DetailSkeleton />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-lg font-semibold text-slate-700">Pesanan tidak ditemukan.</p>
        <Link
          href={ROUTES.ORDERS}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pesanan
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const statusConf = STATUS_CONFIG[order.status] ?? { label: order.status, variant: "default" as const };
  const isShipped  = order.status === OrderStatus.SHIPPED;
  const isDone     = order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        {/* Back */}
        <Link
          href={ROUTES.ORDERS}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pesanan
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900">
              Detail Pesanan
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-400">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge variant={statusConf.variant} className="shrink-0 text-sm px-3 py-1">
            {statusConf.label}
          </Badge>
        </div>

        {/* Timeline */}
        <OrderTimeline order={order} />

        {/* Listing card */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Item Lelang
            </p>
            <Link
              href={ROUTES.LISTING_DETAIL(order.listing.id)}
              className="flex items-start gap-4 transition-opacity hover:opacity-80"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                {order.listing.imageUrls[0] ? (
                  <Image
                    src={order.listing.imageUrls[0]}
                    alt={order.listing.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-6 w-6 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{order.listing.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{order.listing.category.name}</p>
              </div>
            </Link>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 space-y-2">
            <InfoRow label="Harga akhir" value={
              <span className="font-bold text-blue-700">{formatRupiah(order.finalPrice)}</span>
            } />
            {order.paymentMethod && (
              <InfoRow label="Metode pembayaran" value={order.paymentMethod} />
            )}
            <InfoRow label="Tanggal order" value={formatDateTime(order.createdAt)} />
            {order.trackingNumber && (
              <InfoRow
                label="Nomor resi"
                value={
                  <span className="font-mono font-medium text-slate-800">{order.trackingNumber}</span>
                }
              />
            )}
          </div>
        </div>

        {/* Seller info */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Penjual</p>
          <div className="flex items-center gap-3">
            <Avatar name={order.seller.name} src={order.seller.avatarUrl ?? undefined} size="sm" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{order.seller.name}</p>
              <p className="text-xs text-slate-400">{order.seller.email}</p>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Alamat Pengiriman
            </p>
            <p className="text-sm font-semibold text-slate-900">{order.shippingAddress.recipientName}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.province} {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-slate-400">{order.shippingAddress.phone}</p>
          </div>
        )}

        {/* Actions */}
        {isShipped && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setShowConfirm(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              <Check className="h-4 w-4" />
              Konfirmasi Diterima
            </button>
            <button
              onClick={() => setShowDispute(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4" />
              Ajukan Sengketa
            </button>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
            <p className="text-sm text-emerald-800">
              Pesanan selesai. Terima kasih sudah berbelanja di BidMart!
            </p>
          </div>
        )}

        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID) && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-800">
              Menunggu seller memproses pengiriman. Anda akan mendapat notifikasi saat paket dikirim.
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showConfirm && (
        <ConfirmDialog
          title="Konfirmasi Penerimaan"
          description="Apakah Anda sudah menerima barang dalam kondisi baik? Tindakan ini tidak dapat dibatalkan."
          confirmLabel={actionLoading ? "Memproses…" : "Ya, Konfirmasi"}
          onConfirm={handleConfirm}
          onClose={() => setShowConfirm(false)}
        />
      )}
      {showDispute && (
        <DisputeDialog
          onSubmit={handleDispute}
          onClose={() => setShowDispute(false)}
          submitting={actionLoading}
        />
      )}
    </>
  );
}

/* ─── Helper: info row ────────────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function OrderDetailPage() {
  return (
    <AuthGuard mode="auth-required">
      <OrderDetailContent />
    </AuthGuard>
  );
}
