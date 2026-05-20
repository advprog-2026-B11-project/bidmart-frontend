"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { cn, formatDateTime, formatRupiah } from "@/lib/utils";
import { ListingPreviewCard } from "./ListingPreviewCard";
import type { ListingFormData } from "@/types/seller-form";
import type { Category } from "@/types/api";

interface Props {
  data: ListingFormData;
  categories: Category[];
  onPublish: () => void;
  onSaveDraft: () => void;
  submitting: boolean;
  draftComingSoon?: boolean;
}

export function ListingFormStep3({
  data,
  categories,
  onPublish,
  onSaveDraft,
  submitting,
  draftComingSoon,
}: Props) {
  const [agreed, setAgreed] = useState(false);

  const selectedCategory = categories.find((c) => c.id === data.categoryId);
  const startingPrice = parseInt(data.startingPrice, 10) || 0;
  const reservePrice = data.reservePrice ? parseInt(data.reservePrice, 10) : null;
  const endDate = data.endTime ? new Date(data.endTime) : null;

  return (
    <div className="space-y-6">
      {/* Preview + summary grid */}
      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        {/* Preview card */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tampilan di katalog
          </p>
          <ListingPreviewCard data={data} category={selectedCategory} />
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ringkasan Listing
          </p>
          <SummaryRow label="Judul" value={data.title || "—"} />
          <SummaryRow label="Kategori" value={selectedCategory?.name || "—"} />
          <SummaryRow
            label="Harga awal"
            value={startingPrice > 0 ? formatRupiah(startingPrice) : "—"}
            highlight
          />
          {reservePrice !== null && (
            <SummaryRow label="Harga minimum" value={formatRupiah(reservePrice)} />
          )}
          <SummaryRow
            label="Berakhir"
            value={endDate ? formatDateTime(endDate) : "—"}
          />
          <SummaryRow label="Jenis lelang" value="English Auction" />
          <SummaryRow
            label="Gambar"
            value={data.imageUrl ? "✓ Ditambahkan" : "✗ Belum ada"}
          />
        </div>
      </div>

      {/* Terms */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
        <div className={cn(
          "relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
          agreed ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white"
        )}>
          {agreed && <Check className="h-3 w-3 text-white" />}
          <input
            type="checkbox"
            className="sr-only"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
        </div>
        <span className="text-sm leading-relaxed text-slate-700">
          Saya menyetujui{" "}
          <span className="font-semibold text-blue-600">
            syarat dan ketentuan seller BidMart
          </span>{" "}
          dan menyatakan bahwa karya yang dilelang adalah milik sah saya.
        </span>
      </label>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onPublish}
          disabled={!agreed || submitting}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold text-white",
            "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "bg-blue-700 hover:bg-blue-800 active:bg-blue-900"
          )}
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Mempublikasikan…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Publikasikan Lelang
            </>
          )}
        </button>

        {draftComingSoon ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 py-4 text-sm text-slate-400">
            Simpan Draft — Segera hadir
          </div>
        ) : (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={submitting}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-4 text-sm font-medium text-slate-700",
              "transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            Simpan sebagai Draft
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className={cn(
        "text-right font-medium",
        highlight ? "text-blue-700" : "text-slate-900"
      )}>
        {value}
      </span>
    </div>
  );
}
