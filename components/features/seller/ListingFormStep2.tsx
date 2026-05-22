"use client";

import { useCallback, useEffect } from "react";
import { Info } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import type { EndTimePreset, FormErrors, ListingFormData } from "@/types/seller-form";

const PRESETS: { key: EndTimePreset; label: string; days?: number }[] = [
  { key: "1day",   label: "1 Hari",  days: 1 },
  { key: "3day",   label: "3 Hari",  days: 3 },
  { key: "7day",   label: "7 Hari",  days: 7 },
  { key: "custom", label: "Custom" },
];

/* Format raw digit string → Indonesian thousand-separated display */
function toDisplay(raw: string): string {
  const num = parseInt(raw.replace(/\D/g, ""), 10);
  if (!num) return "";
  return num.toLocaleString("id-ID");
}

/* Strip thousand separators back to raw digit string */
function toRaw(display: string): string {
  return display.replace(/\./g, "").replace(/,/g, "").replace(/\D/g, "");
}

/* ─── Price Input ────────────────────────────────────────────────────────── */

interface PriceInputProps {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  error?: string;
  helper?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

function PriceInput({ label, value, onChange, error, helper, required, placeholder, disabled }: PriceInputProps) {
  const numValue = parseInt(value, 10) || 0;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={toDisplay(value)}
          onChange={(e) => onChange(toRaw(e.target.value))}
          placeholder={placeholder ?? "0"}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 font-medium tabular-nums",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-colors placeholder:text-slate-300",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-red-400" : "border-slate-200"
          )}
        />
      </div>
      {numValue > 0 && (
        <p className="mt-1 text-xs text-emerald-600 tabular-nums">{formatRupiah(numValue)}</p>
      )}
      {helper && !error && (
        <p className="mt-1 flex items-start gap-1 text-xs text-slate-400">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {helper}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Step 2 ─────────────────────────────────────────────────────────────── */

interface Props {
  data: ListingFormData;
  onChange: (field: keyof ListingFormData, value: string) => void;
  errors: FormErrors;
  disabled?: boolean;
}

export function ListingFormStep2({ data, onChange, errors, disabled }: Props) {
  const applyPreset = useCallback((preset: EndTimePreset) => {
    onChange("endTimePreset", preset);
    if (preset === "custom") return;
    const days = preset === "1day" ? 1 : preset === "3day" ? 3 : 7;
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    /* Convert to local datetime-local format YYYY-MM-DDTHH:mm */
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    onChange("endTime", local);
  }, [onChange]);

  /* Seed end time on first mount if empty */
  useEffect(() => {
    if (!data.endTime && data.endTimePreset !== "custom") {
      applyPreset(data.endTimePreset as EndTimePreset);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minDate = new Date(Date.now() + 60 * 60 * 1000);
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const toLocal = (d: Date) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      {/* Starting price */}
      <PriceInput
        label="Harga Awal"
        value={data.startingPrice}
        onChange={(v) => onChange("startingPrice", v)}
        error={errors.startingPrice}
        required
        placeholder="Contoh: 500000"
        disabled={disabled}
      />

      {/* Reserve price */}
      <PriceInput
        label="Harga Minimum (Reserve)"
        value={data.reservePrice}
        onChange={(v) => onChange("reservePrice", v)}
        error={errors.reservePrice}
        helper="Harga minimum agar lelang dianggap menang. Kosongkan untuk lelang pasti menang."
        placeholder="Opsional"
        disabled={disabled}
      />

      {/* End time */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Waktu Berakhir <span className="text-red-500">*</span>
        </label>

        {/* Presets */}
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(key)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                "disabled:cursor-not-allowed disabled:opacity-50",
                data.endTimePreset === key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="datetime-local"
          value={data.endTime}
          min={toLocal(minDate)}
          max={toLocal(maxDate)}
          disabled={disabled}
          onChange={(e) => {
            onChange("endTime", e.target.value);
            onChange("endTimePreset", "custom");
          }}
          className={cn(
            "w-full rounded-lg border bg-slate-50 px-4 py-2.5 text-sm text-slate-900",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            errors.endTime ? "border-red-400" : "border-slate-200"
          )}
        />
        {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>}
        <p className="mt-1.5 text-xs text-slate-400">
          Minimal 1 jam dari sekarang, maksimal 30 hari.
        </p>
      </div>

      {/* Auction type */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Jenis Lelang <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <input
              type="radio"
              name="auctionType"
              value="ENGLISH"
              checked
              readOnly
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-semibold text-blue-900">English Auction</p>
              <p className="mt-0.5 text-xs text-blue-600">
                Penawaran terbuka — peserta dapat melihat dan melampaui bid tertinggi saat ini.
              </p>
            </div>
          </label>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 opacity-60">
            <p className="text-sm font-medium text-slate-400">Lebih banyak tipe segera hadir</p>
            <p className="mt-0.5 text-xs text-slate-400">Dutch Auction, Sealed Bid, dan lainnya</p>
          </div>
        </div>
      </div>
    </div>
  );
}
