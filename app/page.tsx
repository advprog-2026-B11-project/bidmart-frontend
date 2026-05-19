"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Book,
  Camera,
  Gem,
  Gavel,
  Laptop,
  Music,
  Package,
  Palette,
  ShieldCheck,
  Tag,
  Watch,
} from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/Button";
import { ListingCard, ListingCardSkeleton } from "@/components/features/listings/ListingCard";
import { ROUTES } from "@/constants/routes";
import * as listingsApi from "@/lib/api/listings";
import * as categoriesApi from "@/lib/api/categories";
import type { Category, Listing } from "@/types/api";

/* ─── Hero ─────────────────────────────────────────────────────────────────── */

function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-20 lg:py-32">
      {/* Blob decorations */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-100/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-yellow-100/60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left — text */}
          <div>
            <span className="mb-5 inline-block rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-700">
              Platform Lelang Real-time #1
            </span>
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Temukan &amp; menangkan{" "}
              <span className="text-blue-700">karya</span> yang Anda{" "}
              <span className="text-yellow-500">cintai</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-500">
              Ikuti lelang karya seni, barang koleksi, dan lebih dari 100
              kategori secara real-time. Transparan, aman, dan kompetitif.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => router.push(ROUTES.CATALOG)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Mulai Bid
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push(ROUTES.CREATE_LISTING)}
              >
                Jual Karya Anda
              </Button>
            </div>
          </div>

          {/* Right — mock listing showcase */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Lukisan Abstrak — Seri Alam", price: "Rp 2,5 jt", time: "2j 15m", mt: "" },
                { title: "Koleksi Jam Vintage 1960",    price: "Rp 8,0 jt", time: "5j 30m", mt: "mt-8" },
                { title: "Patung Kayu Jati Ukir",       price: "Rp 1,2 jt", time: "1 hari",  mt: "" },
                { title: "Foto Seni Edisi Terbatas",    price: "Rp 950 rb",  time: "3j 00m", mt: "-mt-4" },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${item.mt}`}
                >
                  <div className="mb-3 flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-blue-50">
                    <Palette className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="line-clamp-1 text-xs font-medium text-slate-800">{item.title}</p>
                  <p className="mt-1 text-sm font-semibold text-blue-700">{item.price}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{item.time} tersisa</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Live Auctions ─────────────────────────────────────────────────────────── */

function LiveAuctionsSection() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  const doFetch = useCallback(() => {
    listingsApi
      .getActive(0, 8)
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
    doFetch();
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
              Sedang berlangsung
            </p>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Lelang Aktif
            </h2>
          </div>
          <Link
            href={ROUTES.CATALOG}
            className="hidden items-center gap-1 text-sm font-medium text-blue-700 hover:underline sm:flex"
          >
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-400">Gagal memuat lelang. Coba lagi nanti.</p>
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
              : listings.length === 0
              ? (
                <div className="col-span-full py-16 text-center text-sm text-slate-400">
                  Belum ada lelang aktif saat ini.
                </div>
              )
              : listings.map((l) => <ListingCard key={l.id} listing={l} />)
            }
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link href={ROUTES.CATALOG} className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Categories ─────────────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ElementType> = {
  seni:      Palette,
  lukis:     Palette,
  foto:      Camera,
  kamera:    Camera,
  buku:      Book,
  jam:       Watch,
  perhiasan: Gem,
  musik:     Music,
  elektronik: Laptop,
};

function getCatIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return Tag;
}

const DUMMY_CATS = [
  "Seni Lukis", "Fotografi", "Perhiasan", "Jam Koleksi",
  "Elektronik", "Buku Langka", "Instrumen Musik", "Keramik",
];

function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    categoriesApi
      .getAll()
      .then((cats) => setCategories((cats ?? []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items =
    categories.length > 0
      ? categories.map((c) => ({
          id: c.id,
          name: c.name,
          href: `${ROUTES.CATALOG}?category=${c.id}`,
        }))
      : DUMMY_CATS.map((name) => ({
          id: name,
          name,
          href: `${ROUTES.CATALOG}?category=${encodeURIComponent(name.toLowerCase())}`,
        }));

  return (
    <section className="bg-slate-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-yellow-500">
            Semua jenis
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Jelajahi Kategori
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex h-28 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white">
                <div className="h-10 w-10 rounded-full bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => {
              const Icon = getCatIcon(item.name);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
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
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
            Mudah &amp; transparan
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Cara Kerja BidMart
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-sm"
            >
              <span className="mb-5 block font-serif text-6xl font-bold leading-none text-yellow-400">
                {step.n}
              </span>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
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
    <section className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          Siap jadi seller?
        </h2>
        <p className="mt-4 text-lg text-blue-200">
          Mulai jual karya Anda hari ini. Gratis mendaftar, komisi transparan.
        </p>
        <Button
          size="lg"
          variant="accent"
          className="mt-8 px-8"
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
        <CategoriesSection />
        <HowItWorksSection />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
