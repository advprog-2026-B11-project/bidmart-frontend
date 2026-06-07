"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Smartphone,
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

type SelectedMethod = "BANK" | "GOPAY";

/* ─── Payment method card ────────────────────────────────────────────────── */

interface MethodCardProps {
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}

function MethodCard({ label, sublabel, icon: Icon, active, onClick }: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-slate-800 bg-slate-50 ring-1 ring-slate-800/30"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-slate-800" : "text-slate-400"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", active ? "text-slate-900" : "text-slate-700")}>
          {label}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-[11px] text-slate-400">{sublabel}</p>
        )}
      </div>
      {active && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </button>
  );
}

/* ─── Confirmation Dialog ────────────────────────────────────────────────── */

interface ConfirmDialogProps {
  amount: number;
  method: SelectedMethod;
  bankName: string;
  bankAccount: string;
  phoneNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  amount,
  method,
  bankName,
  bankAccount,
  phoneNumber,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const destination =
    method === "BANK"
      ? <>rekening <span className="font-semibold">{bankName}</span> no. <span className="font-semibold tabular-nums">{bankAccount}</span></>
      : <>akun <span className="font-semibold">GoPay</span> no. <span className="font-semibold tabular-nums">{phoneNumber}</span></>;

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
          ke {destination}.
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

  const [wallet,         setWallet]         = useState<Wallet | null>(null);
  const [amount,         setAmount]         = useState("");
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod>("BANK");
  const [bankName,       setBankName]       = useState("BCA");
  const [bankAccount,    setBankAccount]    = useState("");
  const [phoneNumber,    setPhoneNumber]    = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    walletApi.getBalance().then(setWallet).catch(() => {});
  }, []);

  const numAmount      = parseFloat(amount) || 0;
  const available      = wallet?.balanceAvailable ?? 0;
  const exceedsBalance = numAmount > available;
  const amountValid    = numAmount > 0 && !exceedsBalance;

  const detailsValid =
    selectedMethod === "BANK"
      ? bankAccount.trim().length > 0
      : phoneNumber.trim().length >= 10;

  const canSubmit = amountValid && detailsValid && !submitting;

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
      if (selectedMethod === "BANK") {
        await walletApi.withdraw(
          {
            amount: numAmount,
            paymentMethod: "BANK_TRANSFER",
            bankName,
            bankAccount: bankAccount.trim(),
          },
          idempotencyKey.current
        );
      } else {
        await walletApi.withdraw(
          {
            amount: numAmount,
            paymentMethod: "GOPAY",
            phoneNumber: phoneNumber.trim(),
          },
          idempotencyKey.current
        );
      }

      const destination =
        selectedMethod === "BANK"
          ? `rekening ${bankName} Anda`
          : `akun GoPay Anda`;

      toast.success("Penarikan berhasil!", {
        description: `${formatRupiah(numAmount)} sedang diproses ke ${destination}.`,
      });

      walletApi.getBalance().then(setWallet).catch(() => {});
      setTimeout(() => router.replace(ROUTES.WALLET), 1500);
    } catch {
      toast.error("Gagal memproses penarikan. Coba lagi.");
      idempotencyKey.current = crypto.randomUUID();
    } finally {
      setSubmitting(false);
    }
  }, [numAmount, selectedMethod, bankName, bankAccount, phoneNumber, router]);

  const summaryDestination =
    selectedMethod === "BANK"
      ? `${bankName}${bankAccount ? ` ···${bankAccount.slice(-4)}` : ""}`
      : `GoPay${phoneNumber ? ` ···${phoneNumber.slice(-4)}` : ""}`;

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          amount={numAmount}
          method={selectedMethod}
          bankName={bankName}
          bankAccount={bankAccount.trim()}
          phoneNumber={phoneNumber.trim()}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={ROUTES.WALLET}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dompet
        </Link>

        <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight text-slate-800">
          Tarik Dana
        </h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ── Left: form ── */}
          <form onSubmit={handleFormSubmit} className="space-y-6">

            {/* Amount */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60">
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
                  step="any"
                  required
                  className={cn(
                    "w-full rounded-lg border bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium tabular-nums text-slate-900",
                    "focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20",
                    "transition-colors placeholder:text-slate-300",
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

            {/* Payment method selection */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Metode Penarikan
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <MethodCard
                  label="Transfer Bank"
                  sublabel="BCA, Mandiri, BNI, BRI"
                  icon={Building2}
                  active={selectedMethod === "BANK"}
                  onClick={() => setSelectedMethod("BANK")}
                />
                <MethodCard
                  label="GoPay"
                  sublabel="Tarik ke nomor HP"
                  icon={Smartphone}
                  active={selectedMethod === "GOPAY"}
                  onClick={() => setSelectedMethod("GOPAY")}
                />
              </div>
            </div>

            {/* Bank details — shown when BANK selected */}
            {selectedMethod === "BANK" && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60 space-y-4">
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
            )}

            {/* GoPay details — shown when GOPAY selected */}
            {selectedMethod === "GOPAY" && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60 space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  Detail GoPay
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/[^\d+]/g, ""))
                    }
                    placeholder="08xxxxxxxxxx"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium tabular-nums text-slate-700 placeholder:text-slate-300 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Gunakan format 08xx atau +62xx
                  </p>
                </div>
              </div>
            )}

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
                balance={wallet.balanceAvailable}
                holdBalance={wallet.balanceLocked}
              />
            ) : (
              <Skeleton className="h-32 rounded-2xl" />
            )}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60 space-y-3">
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
                <span className="text-slate-500">Tujuan</span>
                <span className="font-semibold text-slate-900">
                  {summaryDestination}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimasi</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedMethod === "GOPAY" ? "Instan" : "1–2 Hari Kerja"}
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
                      ? formatRupiah(Math.max(0, wallet.balanceAvailable - numAmount))
                      : "—"}
                  </span>
                </div>
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
