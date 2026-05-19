"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { ListingFormStep1 } from "@/components/features/seller/ListingFormStep1";
import { ListingFormStep2 } from "@/components/features/seller/ListingFormStep2";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { AuctionStatus } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import * as listingsApi from "@/lib/api/listings";
import * as categoriesApi from "@/lib/api/categories";
import type { Category, Listing } from "@/types/api";
import type { FormErrors, ListingFormData } from "@/types/seller-form";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function listingToFormData(l: Listing): ListingFormData {
  return {
    title: l.title,
    description: l.description,
    categoryId: l.category.id,
    imageUrl: l.imageUrls[0] ?? "",
    startingPrice: String(l.startingPrice),
    reservePrice: l.reservePrice ? String(l.reservePrice) : "",
    endTimePreset: "custom",
    endTime: isoToDatetimeLocal(l.endAt),
    auctionType: "ENGLISH",
  };
}

function validate(data: ListingFormData): FormErrors {
  const errs: FormErrors = {};
  if (!data.title.trim())  errs.title = "Judul wajib diisi.";
  if (!data.categoryId)    errs.categoryId = "Pilih kategori.";
  if (!data.imageUrl)      errs.imageUrl = "URL gambar wajib diisi.";
  else if (!URL_PATTERN.test(data.imageUrl)) errs.imageUrl = "URL gambar tidak valid.";

  const price = parseInt(data.startingPrice, 10);
  if (!price || price <= 0) errs.startingPrice = "Harga awal wajib diisi.";

  if (!data.endTime) {
    errs.endTime = "Waktu berakhir wajib diisi.";
  } else {
    const end = new Date(data.endTime);
    const maxEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (isNaN(end.getTime())) errs.endTime = "Waktu tidak valid.";
    else if (end > maxEnd)    errs.endTime = "Maksimal 30 hari dari sekarang.";
  }
  return errs;
}

/* ─── Page skeleton ───────────────────────────────────────────────────────── */

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-8 w-64 rounded" />
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ─── Edit content ────────────────────────────────────────────────────────── */

function EditListingContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [listing,    setListing]    = useState<Listing | null>(null);
  const [formData,   setFormData]   = useState<ListingFormData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved,      setSaved]      = useState(false);

  /* Load listing + categories in parallel */
  useEffect(() => {
    Promise.all([
      listingsApi.getById(id),
      categoriesApi.getAll(),
    ])
      .then(([l, cats]) => {
        setListing(l);
        setFormData(listingToFormData(l));
        setCategories(cats);
      })
      .catch((err) => {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 404) setNotFound(true);
        else toast.error("Gagal memuat listing.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = useCallback((field: keyof ListingFormData, value: string) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await listingsApi.update(id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrls: [formData.imageUrl],
        categoryId: formData.categoryId,
        startingPrice: parseInt(formData.startingPrice, 10),
        ...(formData.reservePrice ? { reservePrice: parseInt(formData.reservePrice, 10) } : {}),
        endAt: new Date(formData.endTime).toISOString(),
      });

      setSaved(true);
      toast.success("Listing berhasil diperbarui!");
      setTimeout(() => router.replace(ROUTES.MY_LISTINGS), 1200);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      toast.error(apiErr?.message ?? "Gagal memperbarui listing.");
    } finally {
      setSubmitting(false);
    }
  }, [formData, id, router]);

  if (loading) return <EditSkeleton />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-lg font-semibold text-slate-700">Listing tidak ditemukan.</p>
        <Link
          href={ROUTES.MY_LISTINGS}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Listing Saya
        </Link>
      </div>
    );
  }

  if (!listing || !formData) return null;

  const isLocked = listing.status === AuctionStatus.ACTIVE || listing.status === AuctionStatus.EXTENDED;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={ROUTES.MY_LISTINGS}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Listing Saya
      </Link>

      <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight text-slate-900">
        Edit Listing
      </h1>

      {/* Locked banner */}
      {isLocked && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Listing sedang aktif — tidak bisa diedit
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Tunggu hingga lelang selesai untuk mengubah detail listing ini.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Step 1 fields */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Informasi Karya
            </h2>
            <ListingFormStep1
              data={formData}
              categories={categories}
              onChange={handleChange}
              errors={errors}
              disabled={isLocked}
            />
          </div>

          <div className="border-t border-slate-100" />

          {/* Step 2 fields */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Penawaran & Waktu
            </h2>
            <ListingFormStep2
              data={formData}
              onChange={handleChange}
              errors={errors}
              disabled={isLocked}
            />
          </div>
        </div>

        {/* Submit */}
        {!isLocked && (
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting || saved}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white",
                "transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60",
                saved ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-800 active:bg-blue-900"
              )}
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Tersimpan!
                </>
              ) : submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function EditListingPage() {
  return (
    <AuthGuard mode="auth-required">
      <EditListingContent />
    </AuthGuard>
  );
}
