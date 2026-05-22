"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";
import type { FormErrors, ListingFormData } from "@/types/seller-form";

const URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

const SAMPLE_IMAGES = [
  { label: "Lukisan Abstrak",       url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80" },
  { label: "Patung Modern",         url: "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=600&q=80" },
  { label: "Fotografi Alam",        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80" },
  { label: "Karya Kontemporer",     url: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80" },
  { label: "Seni Digital",          url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80" },
  { label: "Ilustrasi Tradisional", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80" },
];

interface Props {
  data: ListingFormData;
  categories: Category[];
  onChange: (field: keyof ListingFormData, value: string) => void;
  errors: FormErrors;
  disabled?: boolean;
}

export function ListingFormStep1({ data, categories, onChange, errors, disabled }: Props) {
  const [showSamples, setShowSamples] = useState(false);
  const isValidImage = URL_PATTERN.test(data.imageUrl);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            Judul Karya <span className="text-red-500">*</span>
          </label>
          <span className={cn(
            "text-xs tabular-nums",
            data.title.length > 90 ? "text-amber-600" : "text-slate-400"
          )}>
            {data.title.length}/100
          </span>
        </div>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          maxLength={100}
          disabled={disabled}
          placeholder="Masukkan judul karya Anda"
          className={cn(
            "w-full rounded-lg border bg-slate-50 px-4 py-2.5 text-sm text-slate-900",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-colors placeholder:text-slate-300",
            "disabled:cursor-not-allowed disabled:opacity-60",
            errors.title ? "border-red-400" : "border-slate-200"
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Deskripsi
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={5}
          disabled={disabled}
          placeholder="Ceritakan tentang karya Anda — teknik, inspirasi, ukuran, material..."
          className={cn(
            "w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-900 leading-relaxed",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "resize-y transition-colors placeholder:text-slate-300 border-slate-200",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Kategori <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={data.categoryId}
            onChange={(e) => onChange("categoryId", e.target.value)}
            disabled={disabled}
            className={cn(
              "w-full appearance-none rounded-lg border bg-slate-50 py-2.5 pl-4 pr-9 text-sm text-slate-900",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              errors.categoryId ? "border-red-400" : "border-slate-200",
              !data.categoryId && "text-slate-400"
            )}
          >
            <option value="" disabled>Pilih kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
      </div>

      {/* Image URL */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            URL Gambar <span className="text-red-500">*</span>
          </label>
          {!disabled && (
            <button
              type="button"
              onClick={() => setShowSamples((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              <ImageIcon className="h-3 w-3" />
              Contoh gambar
            </button>
          )}
        </div>

        {/* Sample images */}
        {showSamples && (
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:grid-cols-6">
            {SAMPLE_IMAGES.map(({ label, url }) => (
              <button
                key={url}
                type="button"
                title={label}
                onClick={() => { onChange("imageUrl", url); setShowSamples(false); }}
                className="group overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-blue-400"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <Image src={url} alt={label} fill sizes="80px" className="object-cover" />
                </div>
                <p className="mt-1 text-center text-[10px] text-slate-500">{label}</p>
              </button>
            ))}
          </div>
        )}

        <input
          type="url"
          value={data.imageUrl}
          onChange={(e) => onChange("imageUrl", e.target.value)}
          disabled={disabled}
          placeholder="https://example.com/image.jpg"
          className={cn(
            "w-full rounded-lg border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-mono",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-colors placeholder:text-slate-300",
            "disabled:cursor-not-allowed disabled:opacity-60",
            errors.imageUrl ? "border-red-400" : "border-slate-200"
          )}
        />
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500">i</span>
          Upload gambar segera hadir. Untuk saat ini, gunakan URL gambar.
        </p>
        {errors.imageUrl && <p className="mt-1 text-xs text-red-500">{errors.imageUrl}</p>}

        {/* Preview */}
        {data.imageUrl && (
          <div className={cn(
            "mt-3 overflow-hidden rounded-xl border transition-opacity duration-500",
            isValidImage ? "border-emerald-200" : "border-red-200 opacity-70"
          )}>
            {isValidImage ? (
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <Image
                  src={data.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="600px"
                />
                <div className="absolute bottom-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-medium text-white">
                  ✓ Valid
                </div>
              </div>
            ) : (
              <p className="bg-red-50 px-4 py-3 text-xs text-red-600">
                URL tidak valid. Pastikan link berakhiran .jpg, .png, .gif, .webp, atau .svg
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
