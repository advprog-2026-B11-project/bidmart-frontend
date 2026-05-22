"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, Hash, Info, Link as LinkIcon, Lock, X } from "lucide-react";
import { TransactionBadge, isCredit } from "./TransactionBadge";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import * as listingsApi from "@/lib/api/listings";
import type { Listing, Transaction } from "@/types/api";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if referenceId is a UUID (typically listingId)
  const isListingId =
    transaction?.referenceId &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      transaction.referenceId
    );

  useEffect(() => {
    if (!isOpen || !transaction || !isListingId || !transaction.referenceId) {
      setListing(null);
      return;
    }

    setLoading(true);
    listingsApi
      .getById(transaction.referenceId)
      .then((data) => {
        setListing(data);
      })
      .catch((err) => {
        console.error("Gagal memuat detail listing:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, transaction, isListingId]);

  if (!isOpen || !transaction) return null;

  const credit = isCredit(transaction.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xl transition-all duration-300 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
          aria-label="Tutup detail transaksi"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="overflow-y-auto pr-1 flex-1">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 mb-3 shadow-inner">
              <TransactionBadge type={transaction.type} className="scale-110 border-none shadow-sm" />
            </div>
            <h2 className="font-serif text-xl font-bold text-slate-800">
              Rincian Transaksi
            </h2>
            <div className="mt-4">
              <p
                className={`font-mono text-3xl font-extrabold tracking-tight tabular-nums ${
                  credit ? "text-emerald-600" : "text-slate-800"
                }`}
              >
                {credit ? "+" : "-"}
                {formatRupiah(transaction.amount)}
              </p>
            </div>
          </div>

          <div className="py-6 space-y-4">
            {/* ID Transaksi */}
            <div className="flex items-start gap-3">
              <Hash className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  ID Transaksi
                </p>
                <p className="mt-0.5 truncate font-mono text-xs font-semibold text-slate-700 select-all">
                  {transaction.id}
                </p>
              </div>
            </div>

            {/* Waktu */}
            <div className="flex items-start gap-3">
              <Calendar className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Waktu Transaksi
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-700">
                  {formatDateTime(transaction.createdAt)}
                </p>
              </div>
            </div>

            {/* Keterangan */}
            {transaction.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Keterangan
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {transaction.description}
                  </p>
                </div>
              </div>
            )}

            {/* Reference ID / Listing Section */}
            {transaction.referenceId && (
              <div className="flex items-start gap-3 pt-2">
                <Info className="h-4.5 w-4.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Referensi / Listing ID
                  </p>
                  
                  {isListingId ? (
                    loading ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 animate-pulse space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-2/3" />
                        <div className="h-2.5 bg-slate-200 rounded w-1/2" />
                      </div>
                    ) : listing ? (
                      <Link
                        href={ROUTES.LISTING_DETAIL(listing.id)}
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-2xl border border-slate-150 bg-slate-50 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/50"
                      >
                        {listing.imageUrls && listing.imageUrls[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={listing.imageUrls[0]}
                            alt={listing.title}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                            <Lock className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-800 group-hover:text-blue-700">
                            {listing.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                            ID: {listing.id.slice(0, 8)}...
                          </p>
                        </div>
                        <LinkIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                      </Link>
                    ) : (
                      <p className="font-mono text-xs font-semibold text-slate-700">
                        {transaction.referenceId}
                      </p>
                    )
                  ) : (
                    <p className="font-mono text-xs font-semibold text-slate-700 select-all">
                      {transaction.referenceId}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition-all hover:bg-slate-50 hover:shadow hover:ring-slate-300 active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
