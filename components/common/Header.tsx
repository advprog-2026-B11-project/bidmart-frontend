"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hammer,
  ListOrdered,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  User,
  Wallet as WalletIcon,
  Bell,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import NotificationBell from "@/components/features/notifications/NotificationBell";
import { WalletPill } from "@/components/features/wallet/WalletPill";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

function DropdownItem({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
    >
      {icon}
      {children}
    </Link>
  );
}

function DrawerLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

/* ─── Header ──────────────────────────────────────────────────────────────── */

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [scrolled,     setScrolled]     = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  const userMenuRef   = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll border
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click-outside for dropdowns
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`${ROUTES.CATALOG}?keyword=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const isSeller = user?.role === UserRole.SELLER || user?.role === UserRole.ADMIN;

  return (
    <>
      {/* ── Fixed bar ────────────────────────────────────────────────────── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200",
          scrolled && "border-b border-slate-200 shadow-sm"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* Logo — text only */}
          <Link href={ROUTES.HOME} className="shrink-0">
            <Logo variant="mark-only" size="md" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            <NavItem href={ROUTES.CATALOG}>Katalog</NavItem>
            <NavItem href="/how-it-works">Cara Kerja</NavItem>
          </nav>

          {/* Desktop actions */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </>
            ) : isAuthenticated ? (
              <>
                {/* Expandable search */}
                <form onSubmit={handleSearch} className="flex items-center">
                  {searchOpen ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari lelang…"
                        onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                        className="h-8 w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white hover:bg-blue-800"
                      >
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  )}
                </form>

                <WalletPill />
                <NotificationBell />

                {/* User avatar + menu */}
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center rounded-full p-0.5 transition hover:ring-2 hover:ring-blue-200 hover:ring-offset-1"
                  >
                    <Avatar src={user?.avatarUrl} name={user?.name ?? ""} size="sm" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-scale-in">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                        <p className="truncate text-xs text-slate-400">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <DropdownItem href={ROUTES.PROFILE}     icon={<User        className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Profil Saya</DropdownItem>
                        <DropdownItem href={ROUTES.NOTIFICATIONS} icon={<Bell      className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Notifikasi</DropdownItem>
                        <DropdownItem href={ROUTES.MY_BIDS}     icon={<Hammer      className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Bid Saya</DropdownItem>
                        <DropdownItem href={ROUTES.ORDERS}      icon={<Package     className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Pesanan</DropdownItem>
                        {isSeller && (
                          <DropdownItem href={ROUTES.MY_LISTINGS} icon={<ListOrdered className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Listing Saya</DropdownItem>
                        )}
                        <DropdownItem href={ROUTES.WALLET}      icon={<WalletIcon  className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Wallet</DropdownItem>
                        <DropdownItem href={ROUTES.SETTINGS}    icon={<Settings    className="h-4 w-4" />} onClick={() => setUserMenuOpen(false)}>Pengaturan</DropdownItem>
                      </div>

                      <div className="border-t border-slate-100 py-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(ROUTES.CATALOG)}
                  aria-label="Cari"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
                >
                  <Search className="h-4 w-4" />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-300 dark:bg-white dark:text-slate-800 dark:hover:bg-slate-50"
                  onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                >
                  Masuk
                </Button>
                <Button variant="primary" size="sm" onClick={() => router.push(ROUTES.AUTH.REGISTER)}>Daftar</Button>
              </>
            )}
          </div>

          {/* Mobile actions (Bell + Hamburger) */}
          <div className="ml-auto flex items-center gap-1 md:hidden">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer so page content isn't hidden under the fixed bar */}
      <div className="h-16" aria-hidden="true" />

      {/* ── Mobile drawer backdrop ─────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <Logo variant="mark-only" size="sm" />
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lelang…"
              className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          <nav className="space-y-0.5">
            <DrawerLink href={ROUTES.CATALOG}    onNavigate={closeDrawer}>Katalog</DrawerLink>
            <DrawerLink href="/how-it-works"     onNavigate={closeDrawer}>Cara Kerja</DrawerLink>
          </nav>

          {!isLoading && (
            <>
              {isAuthenticated ? (
                <>
                  <div className="my-4 border-t border-slate-100" />
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar src={user?.avatarUrl} name={user?.name ?? ""} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>

                  <nav className="space-y-0.5">
                    <DrawerLink href={ROUTES.PROFILE}      onNavigate={closeDrawer}>Profil Saya</DrawerLink>
                    <DrawerLink href={ROUTES.NOTIFICATIONS} onNavigate={closeDrawer}>Notifikasi</DrawerLink>
                    <DrawerLink href={ROUTES.MY_BIDS}      onNavigate={closeDrawer}>Bid Saya</DrawerLink>
                    <DrawerLink href={ROUTES.ORDERS}       onNavigate={closeDrawer}>Pesanan</DrawerLink>
                    {isSeller && <DrawerLink href={ROUTES.MY_LISTINGS} onNavigate={closeDrawer}>Listing Saya</DrawerLink>}
                    <DrawerLink href={ROUTES.WALLET}       onNavigate={closeDrawer}>Wallet</DrawerLink>
                    <DrawerLink href={ROUTES.SETTINGS}     onNavigate={closeDrawer}>Pengaturan</DrawerLink>
                  </nav>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => { setDrawerOpen(false); logout(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setDrawerOpen(false); router.push(ROUTES.AUTH.LOGIN); }}
                  >
                    Masuk
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => { setDrawerOpen(false); router.push(ROUTES.AUTH.REGISTER); }}
                  >
                    Daftar
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
