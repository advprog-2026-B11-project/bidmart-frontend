"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { useCountingAnimation } from "@/hooks/useCountingAnimation";
import { formatRupiahCompact } from "@/lib/utils";
import { NotificationType } from "@/constants/enums";
import * as walletApi from "@/lib/api/wallet";
import type { Wallet as WalletData, Notification } from "@/types/api";

const POLL_INTERVAL_MS = 10_000;

const BALANCE_NOTIFICATION_TYPES: string[] = [
  NotificationType.PAYMENT_SUCCESS,
  NotificationType.AUCTION_WON,
];

export function WalletPill() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animatedBalance = useCountingAnimation(wallet?.balance ?? null);

  const fetchBalance = useCallback(() => {
    walletApi.getBalance().then(setWallet).catch(() => {});
  }, []);

  /* Initial fetch + 10s polling */
  useEffect(() => {
    fetchBalance();
    pollTimerRef.current = setInterval(fetchBalance, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchBalance]);

  /* WebSocket notification listener */
  useEffect(() => {
    function onWsNotification(e: Event) {
      const notification = (e as CustomEvent<Notification>).detail;
      const relevant =
        BALANCE_NOTIFICATION_TYPES.includes(notification.type) ||
        (notification.type as string).startsWith("BALANCE_");
      if (relevant) fetchBalance();
    }

    window.addEventListener("ws-notification", onWsNotification);
    return () => window.removeEventListener("ws-notification", onWsNotification);
  }, [fetchBalance]);

  return (
    <div className="group relative">
      <button
        onClick={() => router.push("/wallet")}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        <Wallet className="h-3.5 w-3.5 shrink-0" />
        <span className="tabular-nums">
          {animatedBalance !== null ? formatRupiahCompact(animatedBalance) : "—"}
        </span>
      </button>

      {wallet && wallet.holdBalance > 0 && (
        <div className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          Ditahan: {formatRupiahCompact(wallet.holdBalance)}
        </div>
      )}
    </div>
  );
}
