"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { BalanceCard } from "@/components/features/wallet/BalanceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatRupiah } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import * as walletApi from "@/lib/api/wallet";
import type { Wallet } from "@/types/api";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const QUICK_AMOUNTS = [
  { label: "Rp 100K", value: 100_000 },
  { label: "Rp 500K", value: 500_000 },
  { label: "Rp 1 Jt", value: 1_000_000 },
  { label: "Rp 5 Jt", value: 5_000_000 },
  { label: "Rp 10 Jt", value: 10_000_000 },
];

const BANKS = ["BCA", "Mandiri", "BNI", "BRI"];

const MAX_AMOUNT = 100_000_000;

type SelectedMethod = "BANK" | "GOPAY";

/* ─── Payment method card ────────────────────────────────────────────────── */

interface MethodCardProps {
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function MethodCard({
  label,
  sublabel,
  icon: Icon,
  active,
  disabled,
  onClick,
}: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/30"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-blue-600" : "text-slate-400"
        )}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            active ? "text-blue-900" : "text-slate-700"
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-[11px] text-slate-400">{sublabel}</p>
        )}
      </div>
      {active && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      {disabled && (
        <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
          Segera hadir
        </span>
      )}
    </button>
  );
}

/* ─── Content ─────────────────────────────────────────────────────────────── */

function TopUpContent() {
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod>("BANK");
  const [bankName, setBankName] = useState("BCA");
  const [accountNum, setAccountNum] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const idempotencyKey = useRef(crypto.randomUUID());

  useEffect(() => {
    walletApi.getBalance().then(setWallet).catch(() => { });
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const amountValid = numAmount > 0 && numAmount <= MAX_AMOUNT;

  const detailsValid =
    selectedMethod === "BANK"
      ? accountNum.trim().length > 0
      : phoneNumber.trim().length >= 10;

  const canSubmit = amountValid && detailsValid && !submitting;

  const handleQuickAmount = useCallback((value: number) => {
    setAmount(String(value));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSubmitting(true);
      try {
        if (selectedMethod === "BANK") {
          await walletApi.topUp(
            {
              amount: numAmount,
              paymentMethod: "BANK_TRANSFER",
              bankName,
              accountNumber: accountNum.trim(),
            },
            idempotencyKey.current
          );
        } else {
          await walletApi.topUp(
            {
              amount: numAmount,
              paymentMethod: "GOPAY",
              phoneNumber: phoneNumber.trim(),
            },
            idempotencyKey.current
          );
        }

        setSuccess(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        toast.success("Top up berhasil!", {
          description: `${formatRupiah(numAmount)} telah ditambahkan ke saldo Anda.`,
        });

        /* Refresh wallet then redirect */
        walletApi.getBalance().then(setWallet).catch(() => { });
        setTimeout(() => router.replace(ROUTES.WALLET), 1500);
      } catch {
        toast.error("Gagal memproses top up. Coba lagi.");
        /* Regenerate key on failure so user can retry without 409 */
        idempotencyKey.current = crypto.randomUUID();
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, numAmount, selectedMethod, bankName, accountNum, phoneNumber, router]
  );

  const methodLabel =
    selectedMethod === "BANK"
      ? `Transfer Bank (${bankName})`
      : "GoPay";

  return (
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
          Top Up Saldo
        </h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ── Left: form ── */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Amount */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60">
              <label className="mb-3 block text-sm font-semibold text-slate-700">
                Jumlah Top Up
              </label>

              {/* Quick amounts */}
              <div className="mb-3 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleQuickAmount(value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                      numAmount === value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
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
                  max={MAX_AMOUNT}
                  step="any"
                  required
                  className={cn(
                    "w-full rounded-lg border bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium tabular-nums text-slate-900",
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    "transition-colors placeholder:text-slate-300",
                    numAmount > MAX_AMOUNT ? "border-red-400" : "border-slate-200"
                  )}
                />
              </div>
              {numAmount > MAX_AMOUNT && (
                <p className="mt-1.5 text-xs text-red-500">
                  Maksimal top up adalah {formatRupiah(MAX_AMOUNT)}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                Metode Pembayaran
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
                  sublabel="Bayar dengan nomor HP"
                  icon={Smartphone}
                  active={selectedMethod === "GOPAY"}
                  onClick={() => setSelectedMethod("GOPAY")}
                />
                <MethodCard
                  label="OVO"
                  icon={Smartphone}
                  active={false}
                  disabled
                  onClick={() => { }}
                />
                <MethodCard
                  label="Kartu Kredit"
                  icon={CreditCard}
                  active={false}
                  disabled
                  onClick={() => { }}
                />
              </div>
            </div>

            {/* Bank details — shown when BANK selected */}
            {selectedMethod === "BANK" && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100/60 space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  Detail Transfer Bank
                </p>

                {/* Bank select */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Bank Tujuan
                  </label>
                  <div className="relative">
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-9 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    value={accountNum}
                    onChange={(e) =>
                      setAccountNum(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Masukkan nomor rekening"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium tabular-nums text-slate-700 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-medium tabular-nums text-slate-700 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
              disabled={!canSubmit || success}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold text-white",
                "transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                success
                  ? "bg-emerald-500"
                  : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700"
              )}
            >
              {success ? (
                <>
                  <Check className="h-4 w-4" />
                  Berhasil!
                </>
              ) : submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses…
                </>
              ) : (
                `Top Up ${numAmount > 0 ? formatRupiah(numAmount) : ""}`
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
                <span className="text-slate-500">Jumlah</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {numAmount > 0 ? formatRupiah(numAmount) : "—"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Metode</span>
                <span className="font-semibold text-slate-900">
                  {methodLabel}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimasi</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Clock className="h-3.5 w-3.5" />
                  Instan
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    Saldo setelah top up
                  </span>
                  <span className="font-bold tabular-nums text-blue-700">
                    {wallet && numAmount > 0
                      ? formatRupiah(wallet.balanceAvailable + numAmount)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TopUpPage() {
  return (
    <AuthGuard mode="auth-required">
      <TopUpContent />
    </AuthGuard>
  );
}
