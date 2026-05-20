import Link from "next/link";
import { AtSign, Globe, Share2 } from "lucide-react";
import { Logo } from "./Logo";
import { ROUTES } from "@/constants/routes";

const COLUMNS = [
  {
    title: "Jelajah",
    links: [
      { label: "Katalog",        href: ROUTES.CATALOG },
      { label: "Kategori",       href: ROUTES.CATALOG },
      { label: "Lelang Berakhir", href: `${ROUTES.CATALOG}?status=ENDED` },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Cara Kerja", href: "/how-it-works" },
      { label: "FAQ",        href: "/faq" },
      { label: "Kontak",     href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Syarat & Ketentuan", href: "/terms" },
      { label: "Kebijakan Privasi",  href: "/privacy" },
    ],
  },
];

const SOCIALS = [
  { Icon: AtSign, label: "Instagram" },
  { Icon: Share2, label: "Twitter"   },
  { Icon: Globe,  label: "Facebook"  },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="md" white />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Platform lelang karya seni &amp; barang koleksi secara real-time.
              Bid kompetitif, integritas terjaga.
            </p>
            <div className="mt-5 flex gap-2.5">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-100">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BidMart. Semua hak dilindungi.
          </p>
          <div className="flex gap-6">
            <Link href="/terms"   className="text-xs text-slate-500 transition-colors hover:text-slate-300">Syarat</Link>
            <Link href="/privacy" className="text-xs text-slate-500 transition-colors hover:text-slate-300">Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
