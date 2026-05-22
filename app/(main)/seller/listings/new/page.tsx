"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { ListingFormStep1 } from "@/components/features/seller/ListingFormStep1";
import { ListingFormStep2 } from "@/components/features/seller/ListingFormStep2";
import { ListingFormStep3 } from "@/components/features/seller/ListingFormStep3";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import * as listingsApi from "@/lib/api/listings";
import * as categoriesApi from "@/lib/api/categories";
import type { Category } from "@/types/api";
import {
  INITIAL_FORM_DATA,
  type FormErrors,
  type ListingFormData,
} from "@/types/seller-form";
import { UserRole } from "@/constants/enums";

/* ─── Validation ──────────────────────────────────────────────────────────── */

const URL_PATTERN = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

function validateStep1(data: ListingFormData): FormErrors {
  const errs: FormErrors = {};
  if (!data.title.trim()) errs.title = "Judul wajib diisi.";
  if (!data.categoryId)   errs.categoryId = "Pilih kategori.";
  if (!data.imageUrl)     errs.imageUrl = "URL gambar wajib diisi.";
  else if (!URL_PATTERN.test(data.imageUrl)) errs.imageUrl = "URL gambar tidak valid.";
  return errs;
}

function validateStep2(data: ListingFormData): FormErrors {
  const errs: FormErrors = {};
  const price = parseInt(data.startingPrice, 10);
  if (!price || price <= 0) errs.startingPrice = "Harga awal wajib diisi.";

  if (!data.endTime) {
    errs.endTime = "Waktu berakhir wajib diisi.";
  } else {
    const end = new Date(data.endTime);
    const minEnd = new Date(Date.now() + 60 * 60 * 1000);
    const maxEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (end <= minEnd) errs.endTime = "Waktu berakhir minimal 1 jam dari sekarang.";
    else if (end > maxEnd) errs.endTime = "Waktu berakhir maksimal 30 hari dari sekarang.";
  }
  return errs;
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */

type Action =
  | { type: "SET_FIELD"; field: keyof ListingFormData; value: string }
  | { type: "RESET" };

function reducer(state: ListingFormData, action: Action): ListingFormData {
  switch (action.type) {
    case "SET_FIELD": return { ...state, [action.field]: action.value };
    case "RESET":     return INITIAL_FORM_DATA;
    default:          return state;
  }
}

/* ─── Step indicator ──────────────────────────────────────────────────────── */

const STEPS = [
  { label: "Informasi Karya" },
  { label: "Penawaran & Waktu" },
  { label: "Review & Publish" },
];

interface StepIndicatorProps {
  current: number; // 1-indexed
}

function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="relative mb-4 h-1.5 rounded-full bg-slate-200">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        {STEPS.map((s, i) => {
          const num = i + 1;
          const done = num < current;
          const active = num === current;
          return (
            <div key={num} className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                done   && "border-blue-600 bg-blue-600 text-white",
                active && "border-blue-600 bg-white text-blue-600",
                !done && !active && "border-slate-300 bg-white text-slate-400"
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : num}
              </div>
              <span className={cn(
                "hidden text-[11px] font-medium sm:block",
                active ? "text-blue-700" : done ? "text-slate-500" : "text-slate-400"
              )}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Create wizard content ───────────────────────────────────────────────── */

function CreateListingContent() {
  const router = useRouter();

  const [formData, dispatch] = useReducer(reducer, INITIAL_FORM_DATA);
  const [step,       setStep]       = useState(1);
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof ListingFormData, value: string) => {
    dispatch({ type: "SET_FIELD", field, value });
    /* Clear field error on change */
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /* Load categories */
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  /* Navigation */
  const handleNext = useCallback(() => {
    let errs: FormErrors = {};
    if (step === 1) errs = validateStep1(formData);
    if (step === 2) errs = validateStep2(formData);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }, [step, formData]);

  const handleBack = useCallback(() => {
    setErrors({});
    setStep((s) => s - 1);
  }, []);

  /* Submit helpers */
  const buildPayload = useCallback(() => ({
    title: formData.title.trim(),
    description: formData.description.trim(),
    imageUrls: formData.imageUrl ? [formData.imageUrl] : [],
    categoryId: formData.categoryId,
    startingPrice: parseInt(formData.startingPrice, 10),
    ...(formData.reservePrice ? { reservePrice: parseInt(formData.reservePrice, 10) } : {}),
    startAt: new Date().toISOString(),
    endAt: new Date(formData.endTime).toISOString(),
  }), [formData]);

  const handlePublish = useCallback(async () => {
    setSubmitting(true);
    try {
      await listingsApi.create(buildPayload());
      toast.success("Listing berhasil dipublikasikan!", {
        description: "Lelang Anda kini aktif di BidMart.",
      });
      router.replace(ROUTES.MY_LISTINGS);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 403) {
        toast.error("Tidak bisa membuat listing", {
          description: "Hubungi admin untuk menjadi seller.",
        });
      } else {
        toast.error(apiErr?.message ?? "Gagal membuat listing. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, router]);

  /* Draft — backend doesn't support status in CreateListingRequest, show coming soon */
  const handleSaveDraft = useCallback(() => {
    /* no-op: draftComingSoon=true hides this button */
  }, []);

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
        Buat Listing Baru
      </h1>

      <StepIndicator current={step} />

      {/* Step panels */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-slate-800">
          {STEPS[step - 1].label}
        </h2>

        {step === 1 && (
          <ListingFormStep1
            data={formData}
            categories={categories}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {step === 2 && (
          <ListingFormStep2
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        )}
        {step === 3 && (
          <ListingFormStep3
            data={formData}
            categories={categories}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            submitting={submitting}
            draftComingSoon
          />
        )}
      </div>

      {/* Navigation buttons (not on step 3 — it has its own) */}
      {step < 3 && (
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Sebelumnya
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Selanjutnya
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Back button on step 3 */}
      {step === 3 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali edit
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function CreateListingPage() {
  return (
    <AuthGuard mode="role" allowedRoles={[UserRole.SELLER, UserRole.ADMIN]}>
      <CreateListingContent />
    </AuthGuard>
  );
}
