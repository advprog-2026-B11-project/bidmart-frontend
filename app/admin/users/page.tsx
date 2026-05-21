"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShieldOff,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import * as adminApi from "@/lib/api/admin";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AdminUser } from "@/types/api";

/* ─── Role badge colours ───────────────────────────────────────────────────── */

const ROLE_VARIANT: Record<string, "info" | "accent" | "danger" | "default"> = {
  ADMIN:            "danger",
  INTERNAL_SERVICE: "danger",
  SELLER:           "accent",
  BUYER:            "default",
};

const ALL_ROLES = ["BUYER", "SELLER", "ADMIN", "INTERNAL_SERVICE"];

/* ─── Deactivate confirmation dialog ──────────────────────────────────────── */

interface DeactivateDialogProps {
  user: AdminUser;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeactivateDialog({ user, onConfirm, onClose }: DeactivateDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <ShieldOff className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Nonaktifkan akun?</h3>
        <p className="mt-2 text-sm text-slate-500">
          Akun <span className="font-semibold text-slate-800">{user.displayName || user.username}</span> ({user.email}) akan dinonaktifkan dan semua sesi aktifnya di seluruh perangkat akan langsung diinvalidasi.
        </p>
        <p className="mt-2 text-xs text-red-600">
          Pengguna tidak akan bisa login sampai akun diaktifkan kembali.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses…
              </span>
            ) : "Nonaktifkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Role change popover ──────────────────────────────────────────────────── */

interface RolePopoverProps {
  user: AdminUser;
  onSave: (role: string) => Promise<void>;
  onClose: () => void;
}

function RolePopover({ user, onSave, onClose }: RolePopoverProps) {
  const [selected, setSelected] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [onClose]);

  const handleSave = async () => {
    if (selected === user.role) { onClose(); return; }
    setBusy(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="border-b border-slate-100 px-3 py-2.5">
        <p className="text-xs font-semibold text-slate-700">Ganti Role</p>
        <p className="text-[11px] text-slate-400 truncate">{user.username}</p>
      </div>
      <div className="p-1">
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setSelected(role)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              selected === role
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-slate-50"
            )}
          >
            {role}
            {selected === role && <Check className="h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={handleSave}
          disabled={busy || selected === user.role}
          className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function AdminUsersPage() {
  const [users,          setUsers]          = useState<AdminUser[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter,     setRoleFilter]     = useState("");
  const [page,           setPage]           = useState(0);
  const [totalPages,     setTotalPages]     = useState(1);
  const [totalElements,  setTotalElements]  = useState(0);
  const [deactivating,   setDeactivating]   = useState<AdminUser | null>(null);
  const [roleEditing,    setRoleEditing]    = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.listUsers({
        page,
        size: 15,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      });
      setUsers(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat pengguna.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset ke page 0 saat filter/search berubah
  useEffect(() => { setPage(0); }, [debouncedSearch, roleFilter]);

  const handleDeactivate = async () => {
    if (!deactivating) return;
    await adminApi.deactivateUser(deactivating.id);
    toast.success(`Akun ${deactivating.username} berhasil dinonaktifkan. Semua sesi aktif telah diinvalidasi.`);
    setDeactivating(null);
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await adminApi.changeUserRole(userId, role);
    toast.success("Role berhasil diubah.");
    fetchUsers();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kelola akun pengguna, role, dan sesi aktif.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari username atau email…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Semua Role</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <span className="text-xs text-slate-400">
          {totalElements} pengguna
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Pengguna</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Role</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">MFA</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Bergabung</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-36" /></div></div></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-8 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-7 w-16 rounded-lg" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "transition-colors hover:bg-slate-50/60",
                    !u.active && "opacity-60"
                  )}
                >
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.imageUrl} name={u.displayName || u.username} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          {u.displayName || u.username}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[u.role] ?? "default"}>
                      {u.role}
                    </Badge>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={u.active ? "success" : "danger"}>
                      {u.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>

                  {/* MFA */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-medium",
                      u.mfaEnabled ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {u.mfaEnabled ? "✓ Aktif" : "—"}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Role change */}
                      <div className="relative">
                        <button
                          onClick={() => setRoleEditing(roleEditing === u.id ? null : u.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          Role
                        </button>
                        {roleEditing === u.id && (
                          <RolePopover
                            user={u}
                            onSave={(role) => handleRoleChange(u.id, role)}
                            onClose={() => setRoleEditing(null)}
                          />
                        )}
                      </div>

                      {/* Deactivate */}
                      {u.active && (
                        <button
                          onClick={() => setDeactivating(u)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Nonaktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">
              Halaman {page + 1} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate dialog */}
      {deactivating && (
        <DeactivateDialog
          user={deactivating}
          onConfirm={handleDeactivate}
          onClose={() => setDeactivating(null)}
        />
      )}
    </div>
  );
}
