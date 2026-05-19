"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { BalanceCard } from "@/components/features/wallet/BalanceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatRupiah } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import * as walletApi from "@/lib/api/wallet";
import type { Wallet } from "@/types/api";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const BANKS = ["BCA", "Mandiri", "BNI", "BRI"];

const QUICK_AMOUNTS = [
  { label: "Rp 100K",  value: 100_000 },
  { label: "Rp 500K",  value: 500_000 },
  { label: "Rp 1 Jt",  value: 1_000_000 },
  { label: "Rp 5 Jt",  value: 5_000_000 },
];

/* ─── Confirmation Dialog ────────────────────────────────────────────────── */

interface ConfirmDialogProps {
  amount: number;
  bankName: string;
  bankAccount: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  amount,
  bankName,
  bankAccount,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Konfirmasi Penarikan
          </h2>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Anda akan menarik dana senilai{" "}
          <span className="font-bold text-slate-900">{formatRupiah(amount)}</span>{" "}
          ke rekening <span className="font-semibold">{bankName}</span>{" "}
          no. <span className="font-semibold tabular-nums">{bankAccount}</span>.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <ArrowUpRight className="h-4 w-4" />
            Ya, Tarik Dana
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Content ─────────────────────────────────────────────────────────────── */

function WithdrawContent() {
  const router = useRouter();

  const [wallet,      setWallet]      = useState<Wallet | null>(null);
  const [amount,      setAmount]      = useState("");
  const [bankName,    setBankName]    = useState("BCA");
  const [bankAccount, setBankAccount] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    walletApi.getBalance().then(setWallet).catch(() => {});
  }, []);

  const numAmount      = parseFloat(amount) || 0;
  const available      = wallet?.balance ?? 0;
  const exceedsBalance = numAmount > available;
  const amountValid    = numAmount > 0 && !exceedsBalance;
  const canSubmit      = amountValid && bankAccount.trim().length > 0 && !submitting;

  const handleQuickAmount = useCallback((value: number) => {
    setAmount(String(value));
  }, []);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setShowConfirm(true);
    },
    [canSubmit]
  );

  const handleConfirm = useCallback(async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await walletApi.withdraw({
        amount: numAmount,
        bankName,
        bankAccount: bankAccount.trim(),
      });

      toast.success("Penarikan berhasil!", {
        description: `${formatRupiah(numAmount)} sedang diproses ke rekening ${bankName} Anda.`,
      });

      walletApi.getBalance().then(setWallet).catch(() => {});
      setTimeout(() => router.replace(ROUTES.WALLET), 1500);
    } catch {
      toast.error("Gagal memproses penarikan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }, [numAmount, bankName, bankAccount, router]);

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          amount={numAmount}
          bankName={bankName}
          bankAccount={bankAccount.trim()}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={ROUTES.WALLET}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dompet
        </Link>

        <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight text-slate-900">
          Tarik Dana
        </h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ── Left: form ── */}
          <form onSubmit={handleFormSubmit} className="space-y-6">

            {/* Amount */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Jumlah Penarikan
              </label>

              {/* Quick amounts */}
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleQuickAmount(value)}
                    disabled={value > available}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                      numAmount === value
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100",
                      value > available && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min={1}
                  max={available}
                  step={1000}
                  required
                  className={cn(
                    "w-full rounded-lg border bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium tabular-nums",
                    "focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20",
                    "transition-colors",
                    exceedsBalance ? "border-red-400" : "border-slate-200"
                  )}
                />
              </div>

              {/* Helper / error text */}
              {exceedsBalance ? (
                <p className="mt-1.5 text-xs text-red-500">
                  Melebihi saldo tersedia {formatRupiah(available)}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-400">
                  Maks:{" "}
                  <span className="font-medium text-slate-600">
                    {formatRupiah(available)}
                  </span>
                </p>
              )}
            </div>

            {/* Bank details */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                Rekening Tujuan
              </p>

              {/* Bank select */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Bank
                </label>
                <div className="relative">
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-9 text-sm font-medium text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Account number */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={bankAccount}
                  onChange={(e) =>
                    setBankAccount(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Masukkan nomor rekening"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium tabular-nums text-slate-700 placeholder:text-slate-300 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold text-white",
                "transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "bg-slate-900 hover:bg-slate-800 active:bg-slate-700"
              )}
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses…
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4" />
                  Tarik{numAmount > 0 ? ` ${formatRupiah(numAmount)}` : " Dana"}
                </>
              )}
            </button>
          </form>

          {/* ── Right: summary panel ── */}
          <div className="space-y-4">
            {wallet ? (
              <BalanceCard
                balance={wallet.balance}
                holdBalance={wallet.holdBalance}
              />
            ) : (
              <Skeleton className="h-32 rounded-2xl" />
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Ringkasan
              </p>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Jumlah ditarik</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {numAmount > 0 ? formatRupiah(numAmount) : "—"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Rekening</span>
                <span className="font-semibold text-slate-900">
                  {bankName}
                  {bankAccount ? ` ···${bankAccount.slice(-4)}` : ""}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimasi</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Clock className="h-3.5 w-3.5" />
                  1–2 Hari Kerja
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    Saldo setelah tarik
                  </span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      exceedsBalance ? "text-red-600" : "text-slate-900"
                    )}
                  >
                    {wallet && numAmount > 0
                      ? formatRupiah(Math.max(0, wallet.balance - numAmount))
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function WithdrawPage() {
  return (
    <AuthGuard mode="auth-required">
      <WithdrawContent />
    </AuthGuard>
  );
}
