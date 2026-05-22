"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Gavel,
  Info,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn, formatRupiah } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { AuctionStatus } from "@/constants/enums";
import { generateIdempotencyKey } from "@/lib/idempotency";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/constants/routes";
import * as bidsApi from "@/lib/api/bids";
import * as walletApi from "@/lib/api/wallet";
import type { Listing } from "@/types/api";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface BidFormProps {
  listing: Listing;
  minimumBid: number | null;
  onBidSuccess?: () => void;
}

type PlaceResult = "success" | "failure" | "retry";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const INCREMENTS = [
  { label: "+Rp 50K",  value: 50_000 },
  { label: "+Rp 100K", value: 100_000 },
  { label: "+Rp 500K", value: 500_000 },
  { label: "+Rp 1jt",  value: 1_000_000 },
];

/* ─── Confetti ───────────────────────────────────────────────────────────── */

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"],
  });
}

/* ─── Insufficient Balance Modal ─────────────────────────────────────────── */

function InsufficientModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-7 w-7 shrink-0" />
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Saldo tidak cukup
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Saldo dompet Anda tidak cukup untuk memasang penawaran ini. Segera
          top-up agar bisa mengikuti lelang.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href={ROUTES.WALLET}
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <Wallet className="h-4 w-4" />
            Top-up Sekarang
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── BidForm ─────────────────────────────────────────────────────────────── */

export function BidForm({ listing, minimumBid, onBidSuccess }: BidFormProps) {
  const { user, isAuthenticated } = useAuth();

  const [amount,        setAmount]        = useState("");
  const [proxyBid,      setProxyBid]      = useState(false);
  const [proxyMax,      setProxyMax]      = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [balance,       setBalance]       = useState<number | null>(null);
  const [showModal,     setShowModal]     = useState(false);
  const [flashAmount,   setFlashAmount]   = useState(false);

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Derived */
  const isSeller  = !!user && user.id === listing.sellerId;
  const isActive  = listing.status === AuctionStatus.ACTIVE || listing.status === AuctionStatus.EXTENDED;
  const isClosed  = listing.status === AuctionStatus.ENDED
                 || listing.status === AuctionStatus.SOLD
                 || listing.status === AuctionStatus.CANCELLED;

  const minRequired   = minimumBid ?? listing.startingPrice;
  const numAmount     = parseFloat(amount) || 0;
  const numProxyMax   = parseFloat(proxyMax) || 0;

  const amountTooLow   = numAmount > 0 && numAmount < minRequired;
  const proxyError     = proxyBid && numProxyMax > 0 && numProxyMax < numAmount;
  const lowBalance     = balance !== null && numAmount > 0 && balance < numAmount;

  /* Fetch wallet balance */
  useEffect(() => {
    if (!isAuthenticated) return;
    walletApi.getBalance().then((w) => setBalance(w.balance)).catch(() => {});
  }, [isAuthenticated]);

  /* Quick increment */
  const handleIncrement = useCallback(
    (inc: number) => {
      setAmount((prev) => {
        const base = parseFloat(prev) || minRequired;
        return String(base + inc);
      });
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setFlashAmount(true);
      flashTimerRef.current = setTimeout(() => setFlashAmount(false), 350);
    },
    [minRequired]
  );

  /* Place bid */
  const doPlace = useCallback(
    async (amt: number, key: string, isRetry = false): Promise<PlaceResult> => {
      try {
        await bidsApi.place(
          {
            listingId: listing.id,
            amount: amt,
            ...(proxyBid && { proxyBid: true, proxyMaxLimit: numProxyMax || undefined }),
          },
          key
        );
        return "success";
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        const st = apiErr?.status ?? 0;
        if (st === 422) { setShowModal(true); return "failure"; }
        if (st === 409 && !isRetry) return "retry";
        if (st === 409) { toast.error("Coba lagi"); return "failure"; }
        toast.error(apiErr?.message ?? "Terjadi kesalahan");
        return "failure";
      }
    },
    [listing.id, proxyBid, numProxyMax]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAuthenticated || !user) return;

      const amt = parseFloat(amount);
      if (!amt || amt < minRequired) {
        toast.error(`Minimal bid adalah ${formatRupiah(minRequired)}`);
        return;
      }
      if (lowBalance)  { setShowModal(true); return; }
      if (proxyError)  { toast.error("Batas proxy harus ≥ jumlah bid"); return; }

      setSubmitting(true);
      const key = generateIdempotencyKey();

      let result = await doPlace(amt, key);

      if (result === "retry") {
        await new Promise((r) => setTimeout(r, 300));
        result = await doPlace(amt, key, true);
      }

      if (result === "success") {
        toast.success("Penawaran berhasil!");
        triggerConfetti();
        setAmount("");
        setProxyBid(false);
        setProxyMax("");
        onBidSuccess?.();
        walletApi.getBalance().then((w) => setBalance(w.balance)).catch(() => {});
      }

      setSubmitting(false);
    },
    [isAuthenticated, user, amount, minRequired, lowBalance, proxyError, doPlace, onBidSuccess]
  );

  /* ── Guards ── */

  if (!isAuthenticated) {
    return (
      <Link
        id="bid-form"
        href={`${ROUTES.AUTH.LOGIN}?next=/catalog/${listing.id}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        <Gavel className="h-4 w-4" />
        Login untuk memasang bid
      </Link>
    );
  }

  if (isSeller) {
    return (
      <div
        id="bid-form"
        className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Ini lelang Anda</p>
          <p className="mt-0.5 text-xs text-blue-600">
            Anda tidak dapat memasang penawaran pada lelang milik sendiri.
          </p>
        </div>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div
        id="bid-form"
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-sm text-slate-400"
      >
        Lelang telah berakhir
      </div>
    );
  }

  if (!isActive) return null;

  /* ── Main form ── */

  return (
    <>
      {showModal && <InsufficientModal onClose={() => setShowModal(false)} />}

      <form
        id="bid-form"
        onSubmit={handleSubmit}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        {/* Minimum info row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          Min. bid berikutnya:
          <span className="font-semibold tabular-nums text-blue-700">
            {formatRupiah(minRequired)}
          </span>
        </div>

        {/* Amount input + quick increments */}
        <div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
              Rp
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(minRequired)}
              min={minRequired}
              step={1000}
              required
              className={cn(
                "w-full rounded-lg border bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium tabular-nums",
                "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                "transition-all duration-150",
                flashAmount && "scale-[1.015] border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300/40",
                amountTooLow ? "border-red-400" : "border-slate-200"
              )}
            />
          </div>
          {amountTooLow && (
            <p className="mt-1 text-xs text-red-500">
              Minimal bid adalah {formatRupiah(minRequired)}
            </p>
          )}

          {/* Quick increment buttons */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {INCREMENTS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleIncrement(value)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Proxy bid toggle */}
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={proxyBid}
            onChange={(e) => setProxyBid(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium text-slate-700">Proxy bid otomatis</span>
        </label>

        {proxyBid && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Batas maksimal proxy bid
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                Rp
              </span>
              <input
                type="number"
                value={proxyMax}
                onChange={(e) => setProxyMax(e.target.value)}
                placeholder={amount || String(minRequired)}
                min={numAmount || minRequired}
                step={1000}
                className={cn(
                  "w-full rounded-lg border bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium tabular-nums",
                  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  "transition-colors duration-150",
                  proxyError ? "border-red-400" : "border-slate-200"
                )}
              />
            </div>
            {proxyError && (
              <p className="mt-1 text-xs text-red-500">
                Batas proxy harus lebih besar dari jumlah bid
              </p>
            )}
          </div>
        )}

        {/* Wallet balance warning */}
        {lowBalance && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Saldo tidak cukup. Top-up dulu{" "}
            <Link href={ROUTES.WALLET} className="font-semibold underline hover:text-red-700">
              →
            </Link>
          </p>
        )}

        {/* Balance display */}
        {balance !== null && !lowBalance && (
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Wallet className="h-3.5 w-3.5" />
            Saldo tersedia:{" "}
            <span className="font-medium text-slate-600">{formatRupiah(balance)}</span>
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || amountTooLow || proxyError}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white",
            "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700"
          )}
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Memproses…
            </>
          ) : (
            <>
              <Gavel className="h-4 w-4" />
              Pasang Penawaran
            </>
          )}
        </button>
      </form>
    </>
  );
}
