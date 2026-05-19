"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Monitor,
  Pencil,
  Shield,
  Smartphone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import * as usersApi from "@/lib/api/users";
import * as sessionsApi from "@/lib/api/sessions";
import type { DeviceSession } from "@/types/api";

/* ─── Device icon ─────────────────────────────────────────────────────────── */

function DeviceIcon({ info }: { info: string }) {
  const lower = info.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
    return <Smartphone className="h-4 w-4 text-slate-400" />;
  }
  return <Monitor className="h-4 w-4 text-slate-400" />;
}

/* ─── Inline edit field ───────────────────────────────────────────────────── */

interface InlineEditFieldProps {
  label: string;
  value: string;
  onSave: (next: string) => Promise<void>;
}

function InlineEditField({ label, value, onSave }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(value);
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    if (input.trim() === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(input.trim());
      setEditing(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan.";
      toast.error(msg);
      setInput(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setInput(value);
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        {editing ? (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            className="mt-1 w-full rounded-lg border border-blue-400 px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : (
          <p className="mt-0.5 text-sm font-medium text-slate-900">{value || "—"}</p>
        )}
      </div>
      {editing ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={handleCancel}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─── Read-only field ─────────────────────────────────────────────────────── */

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3.5">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-500">{value}</p>
    </div>
  );
}

/* ─── Delete account dialog ───────────────────────────────────────────────── */

interface DeleteDialogProps {
  email: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function DeleteAccountDialog({ email, onConfirm, onClose }: DeleteDialogProps) {
  const [input,    setInput]    = useState("");
  const [deleting, setDeleting] = useState(false);
  const match = input.trim().toLowerCase() === email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!match) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm scale-100 rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Hapus akun?</h3>
        <p className="mt-2 text-sm text-slate-500">
          Tindakan ini permanen dan tidak bisa dibatalkan. Semua data, listing, dan riwayat Anda akan dihapus selamanya.
        </p>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            Ketik email Anda untuk konfirmasi: <span className="text-slate-900">{email}</span>
          </label>
          <input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={email}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
          />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={!match || deleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Menghapus…" : "Hapus Akun"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile content ─────────────────────────────────────────────────────── */

function ProfileContent() {
  const { user, refetchUser, logout } = useAuth();

  const [sessions,      setSessions]      = useState<DeviceSession[]>([]);
  const [sessLoading,   setSessLoading]   = useState(true);
  const [revokingId,    setRevokingId]    = useState<string | null>(null);
  const [showDelete,    setShowDelete]    = useState(false);
  const [removingIds,   setRemovingIds]   = useState<Set<string>>(new Set());

  useEffect(() => {
    sessionsApi
      .list()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setSessLoading(false));
  }, []);

  const handleNameSave = useCallback(async (name: string) => {
    await usersApi.updateProfile({ name });
    await refetchUser();
    toast.success("Nama berhasil diperbarui.");
  }, [refetchUser]);

  const handleRevokeSession = useCallback(async (id: string) => {
    setRevokingId(id);
    try {
      await sessionsApi.revoke(id);
      setRemovingIds((prev) => new Set([...prev, id]));
      setTimeout(() => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }, 300);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mencabut sesi.";
      toast.error(msg);
    } finally {
      setRevokingId(null);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    await usersApi.deleteAccount();
    toast.success("Akun berhasil dihapus. Sampai jumpa!");
    logout();
  }, [logout]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">Profil Saya</h1>

      {/* ── Section 1: Info Profil ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Informasi Profil</h2>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={user.name}
                src={user.avatarUrl ?? undefined}
                size="lg"
              />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.toLowerCase()}</p>
              <p className="mt-1 text-[11px] text-slate-400 italic">
                Upload foto — segera hadir
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            <InlineEditField
              label="Nama Tampilan"
              value={user.name}
              onSave={handleNameSave}
            />
            <ReadOnlyField label="Email" value={user.email} />
            <ReadOnlyField label="Role" value={user.role} />
            <div className="py-3.5">
              <p className="text-xs font-semibold text-slate-400">Bergabung sejak</p>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Keamanan ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Keamanan</h2>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* MFA */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Autentikasi Dua Faktor (2FA)</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {user.mfaEnabled
                  ? "2FA aktif — akun Anda lebih aman."
                  : "Aktifkan untuk lapisan keamanan tambahan."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={user.mfaEnabled ? "success" : "default"}>
                {user.mfaEnabled ? "Aktif" : "Nonaktif"}
              </Badge>
              <span
                title="Pengaturan 2FA — segera hadir"
                className="cursor-not-allowed rounded-xl border border-dashed border-slate-200 px-3 py-1.5 text-xs text-slate-400"
              >
                Segera hadir
              </span>
            </div>
          </div>

          {/* Sessions */}
          <div>
            <p className="mb-3 text-sm font-medium text-slate-900">Sesi Aktif</p>
            {sessLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400">Tidak ada sesi aktif lain.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition-all duration-300",
                      removingIds.has(sess.id) && "scale-95 opacity-0"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <DeviceIcon info={sess.deviceInfo} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-800">{sess.deviceInfo}</p>
                          {sess.current && (
                            <Badge variant="info" className="text-[10px] py-0 px-1.5">Sesi ini</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          IP: {sess.ipAddress} · Aktif {formatRelativeTime(sess.lastActiveAt)}
                        </p>
                      </div>
                    </div>
                    {!sess.current && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        disabled={revokingId === sess.id}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {revokingId === sess.id ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Cabut
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 3: Danger Zone ────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
        <div className="border-b border-red-100 bg-red-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700">Zona Berbahaya</h2>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Hapus akun</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Menghapus akun secara permanen. Data yang telah dihapus tidak dapat dipulihkan.
              </p>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Akun
            </button>
          </div>
        </div>
      </section>

      {/* Delete dialog */}
      {showDelete && (
        <DeleteAccountDialog
          email={user.email}
          onConfirm={handleDeleteAccount}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  return (
    <AuthGuard mode="auth-required">
      <ProfileContent />
    </AuthGuard>
  );
}
