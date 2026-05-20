"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import * as notificationsApi from "@/lib/api/notifications";
import type { NotificationPreferences } from "@/types/api";

/* ─── Toggle ──────────────────────────────────────────────────────────────── */

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
        checked ? "bg-blue-600" : "bg-slate-200",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

/* ─── Preference group ────────────────────────────────────────────────────── */

interface PreferenceItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}

interface PreferenceGroupProps {
  title: string;
  items: PreferenceItem[];
  prefs: NotificationPreferences;
  onChange: (key: keyof NotificationPreferences, value: boolean) => void;
}

function PreferenceGroup({ title, items, prefs, onChange }: PreferenceGroupProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map(({ key, label, description }) => (
          <div key={key} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            </div>
            <Toggle checked={prefs[key]} onChange={(v) => onChange(key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Preference groups config ────────────────────────────────────────────── */

const GROUPS: { title: string; items: PreferenceItem[] }[] = [
  {
    title: "Bidding",
    items: [
      {
        key: "bidPlaced",
        label: "Bid masuk pada listing Anda",
        description: "Diberitahu saat ada penawaran baru pada listing lelang Anda.",
      },
      {
        key: "bidOutbid",
        label: "Bid Anda dikalahkan",
        description: "Diberitahu saat penawaran Anda dilampaui oleh penawar lain.",
      },
      {
        key: "auctionWon",
        label: "Memenangkan lelang",
        description: "Diberitahu saat Anda berhasil memenangkan lelang.",
      },
      {
        key: "auctionEnded",
        label: "Lelang berakhir",
        description: "Diberitahu saat lelang yang Anda ikuti telah berakhir.",
      },
    ],
  },
  {
    title: "Pesanan",
    items: [
      {
        key: "orderUpdate",
        label: "Update status pesanan",
        description: "Diberitahu saat status pesanan Anda berubah (dikirim, diterima, dll.).",
      },
    ],
  },
  {
    title: "Pembayaran",
    items: [
      {
        key: "paymentSuccess",
        label: "Pembayaran berhasil",
        description: "Diberitahu saat transaksi pembayaran berhasil diproses.",
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      {
        key: "system",
        label: "Notifikasi sistem",
        description: "Pengumuman penting dan informasi dari tim BidMart.",
      },
    ],
  },
];

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function PrefSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, g) => (
        <div key={g} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Content ─────────────────────────────────────────────────────────────── */

const DEFAULT_PREFS: NotificationPreferences = {
  bidPlaced: true,
  bidOutbid: true,
  auctionWon: true,
  auctionEnded: true,
  orderUpdate: true,
  paymentSuccess: true,
  system: true,
};

function PreferencesContent() {
  const [prefs,     setPrefs]     = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [dirty,     setDirty]     = useState(false);

  useEffect(() => {
    notificationsApi
      .getPreferences()
      .then((p) => { setPrefs(p); })
      .catch(() => toast.error("Gagal memuat preferensi notifikasi."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await notificationsApi.updatePreferences(prefs);
      setPrefs(updated);
      setDirty(false);
      setSaved(true);
      toast.success("Preferensi notifikasi disimpan.");
    } catch {
      toast.error("Gagal menyimpan preferensi.");
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href={ROUTES.NOTIFICATIONS}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Notifikasi
      </Link>

      <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight text-slate-900">
        Preferensi Notifikasi
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        Pilih jenis notifikasi yang ingin Anda terima.
      </p>

      {loading ? (
        <PrefSkeleton />
      ) : (
        <div className="space-y-4">
          {GROUPS.map((group) => (
            <PreferenceGroup
              key={group.title}
              title={group.title}
              items={group.items}
              prefs={prefs}
              onChange={handleChange}
            />
          ))}

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white",
                "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                saved ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-800"
              )}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menyimpan…
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Tersimpan
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function NotificationPreferencesPage() {
  return (
    <AuthGuard mode="auth-required">
      <PreferencesContent />
    </AuthGuard>
  );
}
