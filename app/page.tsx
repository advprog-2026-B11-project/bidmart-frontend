"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Gavel,
  Package,
  ShieldCheck,
} from "lucide-react";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/Button";
import { ListingCard, ListingCardSkeleton } from "@/components/features/listings/ListingCard";
import { ROUTES } from "@/constants/routes";
import * as listingsApi from "@/lib/api/listings";
import type { Listing } from "@/types/api";

/* ─── Hero ─────────────────────────────────────────────────────────────────── */

function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-36">
      {/* Background gradient decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-150 w-150 -translate-x-1/2 -translate-y-1/4 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-yellow-50/60 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">

          {/* Badge */}
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            Platform Lelang Real-time #1
          </span>

          {/* Headline */}
          <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[1.08] text-slate-900 sm:text-6xl lg:text-7xl">
            Bid lebih cerdas,{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              menang
            </span>{" "}
            lebih banyak
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Ribuan karya seni, barang koleksi, hingga elektronik dari seluruh
            Indonesia. Penawaran real-time, transparan, dan langsung ke tangan Anda.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push(ROUTES.CATALOG)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Mulai Bid Sekarang
            </Button>
            <Button
              size="lg"
              variant="dark"
              onClick={() => router.push(ROUTES.CREATE_LISTING)}
            >
              Jual Karya Anda
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {["100% Terverifikasi", "Pembayaran Aman", "Real-time Bidding"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                {t}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Live Auctions ─────────────────────────────────────────────────────────── */

function LiveAuctionsSection() {
  const [listings,     setListings]     = useState<Listing[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [selectedCat,  setSelectedCat]  = useState<string | null>(null);

  const doFetch = useCallback(() => {
    listingsApi
      .getActive(0, 20)
      .then((res) => {
        setListings(res.content ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => { doFetch(); }, [doFetch]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setListings([]);
    setSelectedCat(null);
    doFetch();
  };

  // Derive unique categories from fetched listings
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    listings.forEach((l) => {
      if (l.category?.id && l.category?.name && l.category.name !== "Kategori") {
        map.set(l.category.id, l.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [listings]);

  const displayed = useMemo(() => {
    const base = selectedCat
      ? listings.filter((l) => l.category?.id === selectedCat)
      : listings;
    return base.slice(0, 8);
  }, [listings, selectedCat]);

  const showChips = !loading && !error && categories.length > 1;

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              Sedang berlangsung
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Lelang Aktif
            </h2>
          </div>
          <Link
            href={ROUTES.CATALOG}
            className="hidden items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:flex"
          >
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category chips — only render when there are 2+ categories */}
        {showChips && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              onClick={() => setSelectedCat(null)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCat === null
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  selectedCat === cat.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">Gagal memuat lelang. Coba lagi nanti.</p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Muat ulang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
              : displayed.length === 0
              ? (
                <div className="col-span-full py-16 text-center text-sm text-slate-400">
                  Belum ada lelang aktif saat ini.
                </div>
              )
              : displayed.map((l) => <ListingCard key={l.id} listing={l} />)
            }
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link
            href={ROUTES.CATALOG}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    icon: <Gavel className="h-6 w-6" />,
    title: "Pilih Lelang",
    desc: "Jelajahi ribuan karya seni & barang koleksi yang dilelang setiap hari dari seluruh Indonesia.",
  },
  {
    n: "02",
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Pasang Penawaran",
    desc: "Ajukan bid kompetitif secara real-time. Pantau perkembangan penawaran hingga detik terakhir.",
  },
  {
    n: "03",
    icon: <Package className="h-6 w-6" />,
    title: "Menang & Terima Karya",
    desc: "Pemenang mendapat notifikasi instan dan karya dikirimkan langsung ke tangan Anda dengan aman.",
  },
];

function HowItWorksSection() {
  return (
    <section className="bg-slate-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Mudah &amp; transparan
          </span>
          <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
            Cara Kerja BidMart
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-md"
            >
              {/* Numbered badge */}
              <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-serif text-sm font-bold text-white">
                {step.n}
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                {step.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Banner ─────────────────────────────────────────────────────────────── */

function CTABanner() {
  const router = useRouter();
  return (
    <section className="relative overflow-hidden bg-slate-900 py-24">
      {/* Decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-blue-700/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-yellow-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Untuk Seller
        </span>
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          Siap jadi{" "}
          <span className="bg-linear-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            seller
          </span>
          ?
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">
          Mulai jual karya Anda hari ini. Gratis mendaftar, komisi transparan.
        </p>
        <Button
          size="lg"
          variant="accent"
          className="mt-8 px-10"
          onClick={() => router.push(ROUTES.CREATE_LISTING)}
        >
          Mulai Jual Sekarang
        </Button>
      </div>
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <LiveAuctionsSection />
        <HowItWorksSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
