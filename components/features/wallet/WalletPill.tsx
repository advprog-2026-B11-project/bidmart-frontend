"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { formatRupiahCompact } from "@/lib/utils";
import * as walletApi from "@/lib/api/wallet";
import type { Wallet as WalletData } from "@/types/api";

export function WalletPill() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    walletApi.getBalance().then(setWallet).catch(() => {});
  }, []);

  return (
    <div className="group relative">
      <button
        onClick={() => router.push("/wallet")}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        <Wallet className="h-3.5 w-3.5 shrink-0" />
        <span className="tabular-nums">
          {wallet ? formatRupiahCompact(wallet.balance) : "—"}
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
