import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  CircleDollarSign,
  Lock,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionType } from "@/constants/enums";

interface TransactionBadgeProps {
  type: TransactionType;
  className?: string;
}

const CONFIG: Record<
  TransactionType,
  {
    label: string;
    icon: React.ElementType;
    bg: string;
    text: string;
    border: string;
  }
> = {
  [TransactionType.TOP_UP]: {
    label: "Top Up",
    icon: ArrowDownLeft,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  [TransactionType.BID_HOLD]: {
    label: "Penahanan Bid",
    icon: Lock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  [TransactionType.BID_REFUND]: {
    label: "Refund Bid",
    icon: RotateCcw,
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  [TransactionType.PAYMENT]: {
    label: "Pembayaran",
    icon: CircleDollarSign,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  [TransactionType.PAYOUT]: {
    label: "Pendapatan",
    icon: ArrowUpRight,
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  [TransactionType.COMMISSION]: {
    label: "Komisi",
    icon: BadgeDollarSign,
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  [TransactionType.WITHDRAWAL]: {
    label: "Tarik Dana",
    icon: ArrowUpRight,
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
};

export function TransactionBadge({ type, className }: TransactionBadgeProps) {
  const cfg = CONFIG[type] ?? CONFIG[TransactionType.COMMISSION];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

/** Returns true if the transaction type adds to available balance */
export function isCredit(type: TransactionType): boolean {
  return (
    type === TransactionType.TOP_UP ||
    type === TransactionType.BID_REFUND ||
    type === TransactionType.PAYOUT
  );
}
