"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";
import * as categoriesApi from "@/lib/api/categories";

export interface FilterValues {
  keyword: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  status: "active" | "ended" | "all";
  sort: "newest" | "ending-soon" | "highest-bid";
}

export const DEFAULT_FILTERS: FilterValues = {
  keyword: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  status: "active",
  sort: "newest",
};

interface ListingFiltersProps {
  values: FilterValues;
  onChange: (next: Partial<FilterValues>) => void;
  onReset: () => void;
  className?: string;
}

const STATUS_OPTIONS: { value: FilterValues["status"]; label: string }[] = [
  { value: "active",  label: "Aktif"    },
  { value: "ended",   label: "Berakhir" },
  { value: "all",     label: "Semua"    },
];

const SORT_OPTIONS: { value: FilterValues["sort"]; label: string }[] = [
  { value: "newest",       label: "Terbaru"              },
  { value: "ending-soon",  label: "Segera Berakhir"      },
  { value: "highest-bid",  label: "Penawaran Tertinggi"  },
];

export function ListingFilters({ values, onChange, onReset, className }: ListingFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [localKeyword, setLocalKeyword] = useState(values.keyword);
  const [prevKeywordProp, setPrevKeywordProp] = useState(values.keyword);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state: sync localKeyword when the prop changes from outside (e.g., reset)
  if (prevKeywordProp !== values.keyword) {
    setPrevKeywordProp(values.keyword);
    setLocalKeyword(values.keyword);
  }

  useEffect(() => {
    categoriesApi.getAll().then((cats) => setCategories(cats ?? [])).catch(() => {});
  }, []);

  const handleKeywordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalKeyword(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange({ keyword: val }), 400);
    },
    [onChange]
  );

  const clearKeyword = useCallback(() => {
    setLocalKeyword("");
    onChange({ keyword: "" });
  }, [onChange]);

  const hasActiveFilters =
    !!values.keyword ||
    !!values.category ||
    !!values.minPrice ||
    !!values.maxPrice ||
    values.status !== "active" ||
    values.sort !== "newest";

  return (
    <aside className={cn("flex flex-col gap-6", className)}>

      {/* Search */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Cari
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Judul, deskripsi…"
            value={localKeyword}
            onChange={handleKeywordChange}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm",
              "placeholder:text-slate-400",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "transition-colors"
            )}
          />
          {localKeyword && (
            <button
              onClick={clearKeyword}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Status
        </p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="filter-status"
                value={opt.value}
                checked={values.status === opt.value}
                onChange={() => onChange({ status: opt.value })}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Kategori
          </p>
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <label key={cat.id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={values.category === cat.id}
                  onChange={() =>
                    onChange({ category: values.category === cat.id ? "" : cat.id })
                  }
                  className="h-3.5 w-3.5 rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Harga (Rp)
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={values.minPrice}
            min={0}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
              "placeholder:text-slate-400",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "transition-colors"
            )}
          />
          <input
            type="number"
            placeholder="Max"
            value={values.maxPrice}
            min={0}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
              "placeholder:text-slate-400",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Urutan
        </p>
        <div className="relative">
          <select
            value={values.sort}
            onChange={(e) => onChange({ sort: e.target.value as FilterValues["sort"] })}
            className={cn(
              "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "cursor-pointer transition-colors"
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          <X className="h-3.5 w-3.5" />
          Reset filter
        </button>
      )}
    </aside>
  );
}
