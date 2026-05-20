"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { BalanceCard } from "@/components/features/wallet/BalanceCard";
import { TransactionBadge, isCredit } from "@/components/features/wallet/TransactionBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatRupiah, formatRelativeTime, formatDateTime } from "@/lib/utils";
import { TransactionType } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import * as walletApi from "@/lib/api/wallet";
import type { Transaction, Wallet } from "@/types/api";

/* ─── Quick stats ────────────────────────────────────────────────────────── */

function calcStats(transactions: Transaction[]) {
  if (!transactions?.length) {
    return { topUpTotal: 0, paymentCount: 0, payoutTotal: 0 };
  }

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const topUpTotal = thisMonth
    .filter((t) => t.type === TransactionType.TOP_UP)
    .reduce((s, t) => s + t.amount, 0);

  const paymentCount = thisMonth.filter(
    (t) => t.type === TransactionType.PAYMENT
  ).length;

  const payoutTotal = thisMonth
    .filter((t) => t.type === TransactionType.PAYOUT)
    .reduce((s, t) => s + t.amount, 0);

  return { topUpTotal, paymentCount, payoutTotal };
}

/* ─── Filter types ───────────────────────────────────────────────────────── */

type TypeFilter = "SEMUA" | TransactionType;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "SEMUA", label: "Semua" },
  { key: TransactionType.TOP_UP, label: "Top Up" },
  { key: TransactionType.BID_HOLD, label: "Hold" },
  { key: TransactionType.BID_REFUND, label: "Refund" },
  { key: TransactionType.PAYMENT, label: "Pembayaran" },
  { key: TransactionType.PAYOUT, label: "Pendapatan" },
  { key: TransactionType.COMMISSION, label: "Komisi" },
];

/* ─── Transaction row ────────────────────────────────────────────────────── */

function TransactionRow({ tx }: { tx: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const credit = isCredit(tx.type);

  return (
    <div>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
      >
        {/* Badge */}
        <div className="shrink-0">
          <TransactionBadge type={tx.type} />
        </div>

        {/* Description */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {tx.description}
          </p>
          {tx.referenceId && (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Ref: {tx.referenceId}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="group/date relative shrink-0 text-right">
          <p className="text-xs text-slate-400">
            {formatRelativeTime(tx.createdAt)}
          </p>
          <span className="pointer-events-none absolute -bottom-5 right-0 z-10 hidden whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover/date:block">
            {formatDateTime(tx.createdAt)}
          </span>
        </div>

        {/* Amount */}
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "font-mono text-sm font-semibold tabular-nums",
              credit ? "text-emerald-600" : "text-slate-800"
            )}
          >
            {credit ? "+" : "−"}{formatRupiah(tx.amount)}
          </p>
        </div>

        {/* Expand chevron */}
        <div className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-400">
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mx-4 mb-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">
                Saldo sebelum
              </p>
              <p className="mt-0.5 tabular-nums text-slate-700">
                {formatRupiah(tx.balanceBefore)}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">
                Saldo sesudah
              </p>
              <p className="mt-0.5 tabular-nums text-slate-700">
                {formatRupiah(tx.balanceAfter)}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">
                Waktu
              </p>
              <p className="mt-0.5 text-slate-700">
                {format(new Date(tx.createdAt), "d MMM yyyy, HH:mm", {
                  locale: idLocale,
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function WalletSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-px rounded-xl border border-slate-100 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white px-4 py-3.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Content ─────────────────────────────────────────────────────────────── */

function WalletContent() {
  const [wallet,       setWallet]       = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [txLoading,    setTxLoading]    = useState(false);
  const [page,         setPage]         = useState(0);
  const [hasMore,      setHasMore]      = useState(false);

  /* Filters */
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("SEMUA");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");

  /* Fetch wallet balance */
  const fetchWallet = useCallback(() => {
    walletApi.getBalance().then(setWallet).catch(() => {});
  }, []);

  /* Fetch transactions — accumulate pages */
  const fetchTx = useCallback((p = 0): Promise<void> => {
    return walletApi
      .getTransactions(p, 20)
      .then((res) => {
        setTransactions((prev) =>
          p === 0 ? (res.content ?? []) : [...prev, ...(res.content ?? [])]
        );
        setHasMore(!res.last);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setTxLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTx(0);
  }, [fetchWallet, fetchTx]);

  /* Derived: quick stats */
  const stats = calcStats(transactions);

  /* Derived: filtered list */
  const filtered = (transactions ?? []).filter((tx) => {
    if (typeFilter !== "SEMUA" && tx.type !== typeFilter) return false;
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (new Date(tx.createdAt) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(tx.createdAt) > to) return false;
    }
    return true;
  });

  if (loading) return <WalletSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
          Dompet
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola saldo dan riwayat transaksi Anda.
        </p>
      </div>

      {/* Hero balance card */}
      <BalanceCard
        balance={wallet?.balance ?? null}
        holdBalance={wallet?.holdBalance}
        loading={!wallet}
        className="mb-4"
      />

      {/* CTA buttons */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <Link
          href={ROUTES.WALLET_TOP_UP}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          <ArrowDownLeft className="h-4 w-4" />
          Top Up
        </Link>
        <Link
          href={ROUTES.WALLET_WITHDRAW}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowUpRight className="h-4 w-4" />
          Tarik Dana
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Top Up Bulan Ini
          </p>
          <p className="mt-1 font-serif text-base font-bold tabular-nums text-slate-900">
            {formatRupiah(stats.topUpTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Bid Menang
          </p>
          <p className="mt-1 font-serif text-base font-bold tabular-nums text-slate-900">
            {stats.paymentCount}x
          </p>
          <p className="text-[10px] text-slate-400">bulan ini</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Pendapatan
          </p>
          <p className="mt-1 font-serif text-base font-bold tabular-nums text-slate-900">
            {formatRupiah(stats.payoutTotal)}
          </p>
          <p className="text-[10px] text-slate-400">bulan ini</p>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="mb-4 font-serif text-xl font-bold text-slate-900">
          Riwayat Transaksi
        </h2>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  typeFilter === key
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
            <span className="text-xs text-slate-400">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Ledger */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-white py-14 text-center">
            <p className="text-sm text-slate-400">Tidak ada transaksi ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white divide-y divide-slate-50">
            {filtered.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => {
              setTxLoading(true);
              fetchTx(page + 1);
            }}
            disabled={txLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {txLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              "Muat lebih banyak"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function WalletPage() {
  return (
    <AuthGuard mode="auth-required">
      <WalletContent />
    </AuthGuard>
  );
}
