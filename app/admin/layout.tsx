"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { UserRole } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";

const navItems = [
  { href: ROUTES.ADMIN.USERS, icon: Users,  label: "Manajemen Pengguna" },
  { href: ROUTES.ADMIN.ROLES, icon: Shield, label: "Role & Izin" },
];

function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <LayoutDashboard className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Admin Panel</p>
          <p className="text-[10px] text-slate-400">BidMart</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
        )}
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Aplikasi
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard mode="role" allowedRoles={[UserRole.ADMIN]}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
