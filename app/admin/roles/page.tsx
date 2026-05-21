"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import * as adminApi from "@/lib/api/admin";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AdminRole, Permission } from "@/types/api";

/* ─── Permission checkbox grid ─────────────────────────────────────────────── */

interface PermissionGridProps {
  allPermissions: Permission[];
  selected: Set<string>;
  onChange: (id: string, checked: boolean) => void;
}

function groupPermissions(perms: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const p of perms) {
    const category = p.name.split(":")[0] ?? "other";
    (groups[category] ??= []).push(p);
  }
  return groups;
}

function PermissionGrid({ allPermissions, selected, onChange }: PermissionGridProps) {
  const groups = groupPermissions(allPermissions);

  if (allPermissions.length === 0) {
    return <p className="text-sm text-slate-400">Tidak ada permission tersedia.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([category, perms]) => (
        <div key={category}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {category}
          </p>
          <div className="flex flex-wrap gap-2">
            {perms.map((p) => {
              const checked = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(p.id, !checked)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
                    checked
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Create role form ─────────────────────────────────────────────────────── */

interface CreateRoleFormProps {
  allPermissions: Permission[];
  onCreated: () => void;
  onCancel: () => void;
}

function CreateRoleForm({ allPermissions, onCreated, onCancel }: CreateRoleFormProps) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [busy,        setBusy]        = useState(false);

  const togglePerm = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Nama role tidak boleh kosong."); return; }
    setBusy(true);
    try {
      await adminApi.createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: [...selected],
      });
      toast.success(`Role "${name}" berhasil dibuat.`);
      onCreated();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal membuat role.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Buat Role Baru</p>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Nama Role *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="contoh: MODERATOR"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Deskripsi</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opsional"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-600">
          Pilih Permission ({selected.size} dipilih)
        </label>
        <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
          <PermissionGrid
            allPermissions={allPermissions}
            selected={selected}
            onChange={togglePerm}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          onClick={handleCreate}
          disabled={busy || !name.trim()}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Buat Role
        </button>
      </div>
    </div>
  );
}

/* ─── Role card ────────────────────────────────────────────────────────────── */

interface RoleCardProps {
  role: AdminRole;
  allPermissions: Permission[];
  onUpdated: () => void;
  onDeleted: () => void;
}

function RoleCard({ role, allPermissions, onUpdated, onDeleted }: RoleCardProps) {
  const [expanded,  setExpanded]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [selected,  setSelected]  = useState<Set<string>>(new Set(role.permissions.map((p) => p.id)));
  const [busy,      setBusy]      = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const hasChanges = (() => {
    const original = new Set(role.permissions.map((p) => p.id));
    if (original.size !== selected.size) return true;
    for (const id of selected) if (!original.has(id)) return true;
    return false;
  })();

  const togglePerm = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await adminApi.updateRolePermissions(role.id, { permissionIds: [...selected] });
      toast.success(`Permission role "${role.name}" berhasil diperbarui.`);
      setEditing(false);
      onUpdated();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memperbarui permission.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteRole(role.id);
      toast.success(`Role "${role.name}" berhasil dihapus.`);
      onDeleted();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus role.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            role.system ? "bg-slate-100" : "bg-blue-100"
          )}>
            <Shield className={cn("h-4 w-4", role.system ? "text-slate-500" : "text-blue-600")} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900">{role.name}</p>
              {role.system && <Badge variant="default">System</Badge>}
            </div>
            {role.description && (
              <p className="text-xs text-slate-400 truncate">{role.description}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-slate-400">{role.permissions.length} permission</span>
          {!role.system && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 text-red-400 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={() => { setExpanded((v) => !v); setEditing(false); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {editing ? (
            <>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                <PermissionGrid
                  allPermissions={allPermissions}
                  selected={selected}
                  onChange={togglePerm}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setEditing(false); setSelected(new Set(role.permissions.map((p) => p.id))); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy || !hasChanges}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-3 w-3 animate-spin" />}
                  Simpan
                </button>
              </div>
            </>
          ) : (
            <>
              {role.permissions.length === 0 ? (
                <p className="text-xs text-slate-400">Tidak ada permission yang ditetapkan.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-600"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Edit Permission →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function AdminRolesPage() {
  const [roles,          setRoles]          = useState<AdminRole[]>([]);
  const [permissions,    setPermissions]    = useState<Permission[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        adminApi.listRoles(),
        adminApi.listPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat data.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const permGroups = groupPermissions(permissions);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Role & Izin</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola role kustom dan tetapkan permission granular saat runtime.
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Buat Role
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6">
          <CreateRoleForm
            allPermissions={permissions}
            onCreated={() => { setShowCreateForm(false); fetchData(); }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* All permissions reference */}
      {!loading && permissions.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Semua Permission Tersedia
          </p>
          <div className="space-y-3">
            {Object.entries(permGroups).map(([category, perms]) => (
              <div key={category} className="flex flex-wrap items-center gap-2">
                <span className="shrink-0 text-[11px] font-semibold text-slate-500 w-24">
                  {category}
                </span>
                {perms.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-600"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roles list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))
        ) : roles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">Belum ada role yang terdaftar.</p>
          </div>
        ) : (
          roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              allPermissions={permissions}
              onUpdated={fetchData}
              onDeleted={fetchData}
            />
          ))
        )}
      </div>
    </div>
  );
}
