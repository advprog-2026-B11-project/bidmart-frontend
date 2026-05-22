"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn, formatRupiah, formatRupiahCompact } from "@/lib/utils";
import { useCountingAnimation } from "@/hooks/useCountingAnimation";

interface BalanceCardProps {
  balance: number | null;
  holdBalance?: number | null;
  loading?: boolean;
  className?: string;
}

function CopyButton({ value }: { value: number }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Salin saldo"
      className="ml-2 inline-flex items-center justify-center rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function BalanceCard({
  balance,
  holdBalance,
  loading = false,
  className,
}: BalanceCardProps) {
  const animatedBalance = useCountingAnimation(balance);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-6 text-white shadow-lg",
        className
      )}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 h-48 w-48 rounded-full bg-amber-500/10" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
          Saldo Tersedia
        </p>

        {loading ? (
          <div className="mt-2 flex items-end gap-1">
            <div className="h-9 w-48 animate-pulse rounded-lg bg-white/10" />
          </div>
        ) : (
          <div className="mt-1 flex items-center">
            <p className="font-serif text-2xl font-bold tabular-nums leading-tight tracking-tight text-amber-300 sm:text-3xl md:text-4xl">
              {animatedBalance !== null
                ? formatRupiah(animatedBalance)
                : "Rp —"}
            </p>
            {animatedBalance !== null && (
              <CopyButton value={animatedBalance} />
            )}
          </div>
        )}

        {holdBalance !== undefined && holdBalance !== null && holdBalance > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <p className="text-xs text-blue-200">
              <span className="font-semibold text-amber-300">
                {formatRupiahCompact(holdBalance)}
              </span>{" "}
              sedang di-hold untuk bid aktif
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
