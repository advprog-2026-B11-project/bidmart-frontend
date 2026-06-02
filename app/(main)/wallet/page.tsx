"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { BalanceCard } from "@/components/features/wallet/BalanceCard";
import { TransactionBadge, isCredit } from "@/components/features/wallet/TransactionBadge";
import { TransactionDetailModal } from "@/components/features/wallet/TransactionDetailModal";
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
    .filter((t) => t.type === TransactionType.TOPUP)
    .reduce((s, t) => s + t.amount, 0);

  const paymentCount = thisMonth.filter(
    (t) => t.type === TransactionType.PAYMENT
  ).length;

  const payoutTotal = thisMonth
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((s, t) => s + t.amount, 0);

  return { topUpTotal, paymentCount, payoutTotal };
}

/* ─── Filter types ───────────────────────────────────────────────────────── */

type TypeFilter = "SEMUA" | TransactionType;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "SEMUA", label: "Semua" },
  { key: TransactionType.TOPUP, label: "Top Up" },
  { key: TransactionType.HOLD, label: "Hold" },
  { key: TransactionType.REFUND, label: "Refund" },
  { key: TransactionType.PAYMENT, label: "Pembayaran" },
  { key: TransactionType.INCOME, label: "Pendapatan" },
  { key: TransactionType.WITHDRAWAL, label: "Tarik Dana" },
];

/* ─── Transaction row ────────────────────────────────────────────────────── */

function getTransactionDescription(type: TransactionType) {
  switch (type) {
    case TransactionType.TOPUP: return "Top Up Saldo";
    case TransactionType.HOLD: return "Hold Saldo (Bid)";
    case TransactionType.REFUND: return "Pengembalian Saldo (Bid Kalah)";
    case TransactionType.PAYMENT: return "Pembayaran (Bid Menang)";
    case TransactionType.INCOME: return "Penerimaan Dana";
    case TransactionType.WITHDRAWAL: return "Penarikan Dana";
    default: return "Transaksi";
  }
}

function TransactionRow({ tx, onClick }: { tx: Transaction, onClick: () => void }) {
  const credit = isCredit(tx.type);
  const description = tx.description || getTransactionDescription(tx.type);

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
    >
      {/* Badge */}
      <div className="shrink-0">
        <TransactionBadge type={tx.type} />
      </div>

      {/* Description */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {description}
        </p>
        {tx.referenceId && (
          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            Ref: {tx.referenceId.slice(0, 8)}...
          </p>
        )}
      </div>

      {/* Date */}
      <div className="group/date relative shrink-0 text-right">
        <p className="text-xs text-slate-400">
          {formatRelativeTime(tx.createdAt)}
        </p>
        <span className="pointer-events-none absolute -bottom-6 right-0 z-10 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white group-hover/date:block">
          {formatDateTime(tx.createdAt)}
        </span>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right pl-2">
        <p
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            credit ? "text-emerald-600" : "text-slate-800"
          )}
        >
          {credit ? "+" : "−"}{formatRupiah(tx.amount)}
        </p>
      </div>
    </button>
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  /* Filters */
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("SEMUA");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* Fetch wallet balance */
  const fetchWallet = useCallback(() => {
    walletApi.getBalance().then((data) => {
      setWallet(data);
    }).catch(() => { });
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
      .catch(() => { })
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
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-800">
            Dompet
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola saldo dan riwayat transaksi Anda.
          </p>
        </div>

        {/* Hero balance card */}
        <BalanceCard
          balance={wallet?.balanceAvailable ?? null}
          holdBalance={wallet?.balanceLocked}
          loading={!wallet}
          className="mb-4"
        />

        {/* CTA buttons */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <Link
            href={ROUTES.WALLET_TOP_UP}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow"
          >
            <ArrowDownLeft className="h-4 w-4" />
            Top Up
          </Link>
          <Link
            href={ROUTES.WALLET_WITHDRAW}
            className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition-all hover:shadow hover:ring-slate-300"
          >
            <ArrowUpRight className="h-4 w-4" />
            Tarik Dana
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100/60">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Top Up Bulan Ini
            </p>
            <p className="mt-1 font-serif text-base font-bold tabular-nums text-slate-800">
              {formatRupiah(stats.topUpTotal)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100/60">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Bid Menang
            </p>
            <p className="mt-1 font-serif text-base font-bold tabular-nums text-slate-800">
              {stats.paymentCount}x
            </p>
            <p className="text-[10px] text-slate-400">bulan ini</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100/60">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Pendapatan
            </p>
            <p className="mt-1 font-serif text-base font-bold tabular-nums text-slate-800">
              {formatRupiah(stats.payoutTotal)}
            </p>
            <p className="text-[10px] text-slate-400">bulan ini</p>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="mb-4 font-serif text-xl font-bold text-slate-800">
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
            <div className="rounded-2xl bg-white py-14 text-center shadow-sm ring-1 ring-slate-100/60">
              <p className="text-sm text-slate-400">Tidak ada transaksi ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100/60 divide-y divide-slate-50">
              {filtered.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-100/60 transition-all hover:shadow hover:text-slate-700 disabled:opacity-60"
            >
              {txLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              ) : (
                "Muat lebih banyak"
              )}
            </button>
          )}
        </div>

        <TransactionDetailModal
          transaction={selectedTx}
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
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
