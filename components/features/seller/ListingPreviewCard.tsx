"use client";

import Image from "next/image";
import { cn, formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { ListingFormData } from "@/types/seller-form";
import type { Category } from "@/types/api";

const URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

interface ListingPreviewCardProps {
  data: ListingFormData;
  category?: Category;
  className?: string;
}

export function ListingPreviewCard({ data, category, className }: ListingPreviewCardProps) {
  const isValidImage = URL_PATTERN.test(data.imageUrl);
  const price = parseInt(data.startingPrice, 10) || 0;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
      {/* Cover */}
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {isValidImage ? (
          <Image
            src={data.imageUrl}
            alt={data.title || "Preview"}
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 640px) 100vw, 300px"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-xs">Belum ada gambar</span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge variant="default">Draft</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {data.title ? data.title : (
            <span className="italic text-slate-400">Judul belum diisi</span>
          )}
        </p>
        {category && (
          <p className="text-[10px] text-slate-400">{category.name}</p>
        )}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Harga awal</p>
            <p className="text-sm font-semibold tabular-nums text-blue-700">
              {price > 0 ? formatRupiah(price) : (
                <span className="text-slate-400">—</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
