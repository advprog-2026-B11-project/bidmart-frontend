import { Logo } from "@/components/common/Logo";

const testimonial = {
  quote:
    "Lukisan ekspresionisme koleksi saya terjual 4× harga awal. BidMart menghadirkan kolektor serius dari seluruh Indonesia.",
  author: "Dewi Saraswati",
  sold: "Lukisan 'Fajar Pesisir' — terjual Rp 48.000.000",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left decorative panel (desktop only) ───────────────────────── */}
      <aside
        className="hidden lg:flex lg:w-3/5 relative flex-col justify-between overflow-hidden p-12"
        style={{
          background: "linear-gradient(145deg, #172554 0%, #1E40AF 42%, #2563eb 72%, #1d4ed8 100%)",
        }}
      >
        {/* Dot pattern overlay */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="auth-dots"
              x="0"
              y="0"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
        </svg>

        {/* Wavy accent lines (bottom-right) */}
        <svg
          className="pointer-events-none absolute bottom-0 right-0 opacity-20"
          width="320"
          height="320"
          viewBox="0 0 320 320"
          aria-hidden="true"
        >
          {[0, 40, 80, 120, 160].map((offset) => (
            <path
              key={offset}
              d={`M${offset} 320 Q${offset + 80} ${240 - offset * 0.4} ${offset + 160} 320`}
              stroke="#FCD34D"
              strokeWidth="1.5"
              fill="none"
            />
          ))}
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <Logo size="lg" white />
        </div>

        {/* Tagline + testimonial card */}
        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="text-5xl font-bold leading-tight text-white">
              Lelang karya,
              <br />
              <span className="text-yellow-300">real-time.</span>
            </h1>
            <p className="mt-4 text-lg text-blue-200">
              Platform lelang seni &amp; koleksi premium Indonesia.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <p className="italic leading-relaxed text-white/90">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="mt-4">
              <p className="font-semibold text-white">{testimonial.author}</p>
              <p className="text-sm text-blue-200">{testimonial.sold}</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex gap-10 text-sm text-white/70">
          <div>
            <p className="text-2xl font-bold text-yellow-300">2.400+</p>
            <p>Karya Terjual</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-300">Rp 8M+</p>
            <p>Total Transaksi</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-300">15K</p>
            <p>Kolektor Aktif</p>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <main className="flex w-full flex-col items-center justify-center lg:w-2/5 min-h-screen bg-slate-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo size="md" />
        </div>

        <div className="w-full" style={{ maxWidth: 420 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
