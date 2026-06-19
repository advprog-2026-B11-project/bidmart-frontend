import Link from "next/link";
import Image from "next/image";
import { cn, formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CountdownTimer } from "./CountdownTimer";
import type { Listing } from "@/types/api";
import { AuctionStatus } from "@/constants/enums";

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }
> = {
  ACTIVE:    { label: "Aktif",       variant: "success" },
  EXTENDED:  { label: "Diperpanjang", variant: "warning" },
  ENDED:     { label: "Berakhir",    variant: "default" },
  CLOSED:    { label: "Berakhir",    variant: "default" },
  SOLD:      { label: "Terjual",     variant: "info"    },
  WON:       { label: "Terjual",     variant: "info"    },
  UNSOLD:    { label: "Tidak Terjual", variant: "default" },
  DRAFT:     { label: "Draft",       variant: "default" },
  CANCELLED: { label: "Dibatalkan",  variant: "danger"  },
};

interface ListingCardProps {
  listing: Listing;
  className?: string;
  /** Renders as a non-navigating div for preview purposes */
  preview?: boolean;
}

export function ListingCard({ listing, className, preview = false }: ListingCardProps) {
  const coverUrl = listing.imageUrls[0] ?? null;
  const price    = listing.totalBids > 0 ? listing.currentPrice : listing.startingPrice;
  const status   = statusConfig[listing.status] ?? { label: listing.status, variant: "default" as const };

  const cardClass = cn(
    "group block overflow-hidden rounded-xl border border-slate-200 bg-white",
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
    preview && "cursor-default",
    className
  );

  const inner = (
    <>
      {/* Cover image */}
      <div className="relative aspect-4/5 overflow-hidden bg-slate-100">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {preview && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              Contoh
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {listing.title}
        </p>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              {listing.totalBids > 0 ? "Penawaran tertinggi" : "Harga awal"}
            </p>
            <p className="text-sm font-semibold tabular-nums text-blue-700">
              {formatRupiah(price)}
            </p>
          </div>
          {(listing.status === AuctionStatus.ACTIVE ||
            listing.status === AuctionStatus.EXTENDED) && (
            <CountdownTimer endTime={listing.endAt} />
          )}
        </div>
      </div>
    </>
  );

  if (preview) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link href={`/catalog/${listing.id}`} className={cardClass}>
      {inner}
    </Link>
  );
}

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
      <Skeleton className="aspect-4/5 w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between pt-0.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}
