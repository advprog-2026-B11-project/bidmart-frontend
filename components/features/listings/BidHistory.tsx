"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRelativeTime, formatRupiah } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Bid } from "@/types/api";
import * as bidsApi from "@/lib/api/bids";

interface BidHistoryProps {
  listingId: string;
}

export function BidHistory({ listingId }: BidHistoryProps) {
  const [bids, setBids]           = useState<Bid[]>([]);
  const [loading, setLoading]     = useState(true);

  const doFetch = useCallback((): Promise<void> => {
    return bidsApi
      .getByListing(listingId)
      .then((res) => {
        setBids(res ?? []);
      });
  }, [listingId]);

  useEffect(() => {
    doFetch().finally(() => setLoading(false));
  }, [doFetch]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        Belum ada penawaran.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {bids.map((bid, i) => {
        const isProxy = bid.proxyBid === true;
        const hasMaxLimit = isProxy && bid.proxyMaxLimit != null;

        return (
          <div
            key={bid.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">Anonim</p>
                <p className="text-[11px] text-slate-400">
                  {formatRelativeTime(bid.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="tabular-nums text-sm font-semibold text-blue-700">
                {formatRupiah(bid.amount)}
              </p>
              {isProxy ? (
                <span className="text-[10px] font-medium text-violet-500">
                  {hasMaxLimit
                    ? `Proxy · maks ${formatRupiah(bid.proxyMaxLimit!)}`
                    : "Proxy bid"}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Manual</span>
              )}
              {bid.isWinning && (
                <p className="text-[10px] font-medium text-green-600">Tertinggi</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
