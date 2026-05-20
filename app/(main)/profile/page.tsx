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
import { cn, formatRelativeTime } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import * as usersApi from "@/lib/api/users";
import * as sessionsApi from "@/lib/api/sessions";
import type { DeviceSession, MfaSetupResponse, MfaStatusResponse } from "@/types/api";

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

const DIAL_CODE_FLAGS: Record<string, string> = {
  "1": "🇺🇸",
  "44": "🇬🇧",
  "60": "🇲🇾",
  "61": "🇦🇺",
  "62": "🇮🇩",
  "65": "🇸🇬",
  "81": "🇯🇵",
  "82": "🇰🇷",
  "86": "🇨🇳",
};

const DEFAULT_DIAL_CODE = "62";

function getFlagForDialCode(dialCode: string): string {
  return DIAL_CODE_FLAGS[dialCode] ?? "🌐";
}

function formatLocalNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function splitPhoneValue(value: string): { dialCode: string; number: string } {
  if (!value) return { dialCode: DEFAULT_DIAL_CODE, number: "" };
  const raw = value.trim();
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return { dialCode: DEFAULT_DIAL_CODE, number: "" };

  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  const knownCodes = Object.keys(DIAL_CODE_FLAGS).sort((a, b) => b.length - a.length);
  const matched = knownCodes.find((code) => digits.startsWith(code));

  if (matched) {
    return { dialCode: matched, number: digits.slice(matched.length) };
  }

  if (cleaned.startsWith("+")) {
    const fallback = digits.slice(0, Math.min(3, digits.length));
    return { dialCode: fallback, number: digits.slice(fallback.length) };
  }

  return { dialCode: DEFAULT_DIAL_CODE, number: digits };
}

function formatPhoneDisplay(value: string): string {
  const { dialCode, number } = splitPhoneValue(value);
  const formattedNumber = formatLocalNumber(number);
  if (!dialCode && !formattedNumber) return "—";
  if (!dialCode) return formattedNumber;
  if (!formattedNumber) return `+${dialCode}`;
  return `+${dialCode} ${formattedNumber}`;
}

interface InlinePhoneFieldProps {
  label: string;
  value: string;
  onSave: (next: string) => Promise<void>;
}

function InlinePhoneField({ label, value, onSave }: InlinePhoneFieldProps) {
  const [editing, setEditing] = useState(false);
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  const [localNumber, setLocalNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const split = splitPhoneValue(value);
    setDialCode(split.dialCode || DEFAULT_DIAL_CODE);
    setLocalNumber(split.number);
  }, [editing, value]);

  const handleSave = async () => {
    const normalizedDial = dialCode.replace(/\D/g, "");
    const normalizedLocal = localNumber.replace(/\D/g, "");
    const formattedLocal = formatLocalNumber(normalizedLocal);
    const nextValue = normalizedDial
      ? `+${normalizedDial}${formattedLocal ? ` ${formattedLocal}` : ""}`
      : formattedLocal;

    if ((value || "") === (nextValue || "")) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(nextValue);
      setEditing(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const flag = getFlagForDialCode(dialCode.replace(/\D/g, ""));

  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        {editing ? (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700">
              <span className="text-base" aria-hidden="true">{flag}</span>
              <span className="text-slate-400">+</span>
              <input
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                className="w-14 bg-transparent text-sm text-slate-900 outline-none"
                aria-label="Kode negara"
              />
            </div>
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <input
              value={formatLocalNumber(localNumber)}
              onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="8123 4567 890"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              aria-label="Nomor telepon"
            />
          </div>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-slate-900">
            {value ? formatPhoneDisplay(value) : "—"}
          </p>
        )}
        {editing && (
          <p className="mt-1 text-[11px] text-slate-400">Pisahkan otomatis setiap 4 digit.</p>
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

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidPhoneNumber(value: string): boolean {
  const normalized = value.replace(/[\s-]/g, "");
  return /^\+?\d{8,15}$/.test(normalized);
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
  const [mfaStatus,     setMfaStatus]     = useState<MfaStatusResponse | null>(null);
  const [mfaSetup,      setMfaSetup]      = useState<MfaSetupResponse | null>(null);
  const [mfaLoading,    setMfaLoading]    = useState(true);
  const [mfaBusy,       setMfaBusy]       = useState(false);
  const [mfaAction,     setMfaAction]     = useState<"totp" | "email" | null>(null);
  const [mfaCode,       setMfaCode]       = useState("");
  const [mfaEmailCode,  setMfaEmailCode]  = useState("");
  const [mfaPassword,   setMfaPassword]   = useState("");
  const [mfaTotpCode,   setMfaTotpCode]   = useState("");

  useEffect(() => {
    sessionsApi
      .list()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setSessLoading(false));
  }, []);

  const reloadMfaStatus = useCallback(async () => {
    setMfaLoading(true);
    try {
      const status = await usersApi.getMfaStatus();
      setMfaStatus(status);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal memuat status MFA.";
      toast.error(msg);
    } finally {
      setMfaLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadMfaStatus();
  }, [reloadMfaStatus]);

  const handleDisplayNameSave = useCallback(async (displayName: string) => {
    await usersApi.updateProfile({ displayName });
    await refetchUser();
    toast.success("Nama berhasil diperbarui.");
  }, [refetchUser]);

  const handleAvatarSave = useCallback(async (imageUrl: string) => {
    if (imageUrl && !isValidImageUrl(imageUrl)) {
      toast.error("Format URL gambar tidak valid.");
      return;
    }
    await usersApi.updateProfile({ imageUrl });
    await refetchUser();
    toast.success("Foto profil berhasil diperbarui.");
  }, [refetchUser]);

  const handlePhoneSave = useCallback(async (phoneNumber: string) => {
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      toast.error("Format nomor telepon tidak valid.");
      return;
    }
    await usersApi.updateProfile({ phoneNumber });
    await refetchUser();
    toast.success("Nomor telepon berhasil diperbarui.");
  }, [refetchUser]);

  const handleAddressSave = useCallback(async (shippingAddress: string) => {
    await usersApi.updateProfile({ shippingAddress });
    await refetchUser();
    toast.success("Alamat berhasil diperbarui.");
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

  const handleStartTotp = useCallback(async () => {
    setMfaAction("totp");
    setMfaSetup(null);
    setMfaBusy(true);
    try {
      const setup = await usersApi.setupMfa();
      setMfaSetup(setup);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyiapkan MFA.";
      toast.error(msg);
    } finally {
      setMfaBusy(false);
    }
  }, []);

  const handleStartEmail = useCallback(async () => {
    setMfaAction("email");
    setMfaBusy(true);
    try {
      await usersApi.enableEmailMfa();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengirim kode email.";
      toast.error(msg);
    } finally {
      setMfaBusy(false);
    }
  }, []);

  const handleConfirmTotp = useCallback(async () => {
    // Bersihkan karakter non-digit sebelum validasi & dikirim
    const cleanCode = mfaCode.replace(/\D/g, "");
    
    if (!cleanCode.trim() || cleanCode.length < 6) {
      toast.error("Masukkan 6 digit kode MFA terlebih dulu.");
      return;
    }
    setMfaBusy(true);
    try {
      await usersApi.enableMfa(cleanCode);
      setMfaAction(null);
      setMfaCode("");
      setMfaSetup(null);
      await reloadMfaStatus();
      await refetchUser();
      toast.success("MFA berhasil diaktifkan.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Kode MFA tidak valid.";
      toast.error(msg);
    } finally {
      setMfaBusy(false);
    }
  }, [mfaCode, reloadMfaStatus, refetchUser]);

  const handleConfirmEmail = useCallback(async () => {
    if (!mfaEmailCode.trim()) {
      toast.error("Masukkan kode email terlebih dulu.");
      return;
    }
    setMfaBusy(true);
    try {
      await usersApi.verifyEmailMfa(mfaEmailCode.trim());
      setMfaAction(null);
      setMfaEmailCode("");
      await reloadMfaStatus();
      await refetchUser();
      toast.success("MFA email berhasil diaktifkan.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Kode email tidak valid.";
      toast.error(msg);
    } finally {
      setMfaBusy(false);
    }
  }, [mfaEmailCode, reloadMfaStatus, refetchUser]);

  const handleDisableMfa = useCallback(async (): Promise<boolean> => {
    if (!mfaPassword.trim() && !mfaTotpCode.trim()) {
      toast.error("Masukkan password atau kode TOTP untuk menonaktifkan MFA.");
      return false;
    }
    setMfaBusy(true);
    try {
      await usersApi.disableMfa({
        password: mfaPassword.trim() || undefined,
        totpCode: mfaTotpCode.trim() || undefined,
      });
      setMfaPassword("");
      setMfaTotpCode("");
      setMfaAction(null);
      setMfaSetup(null);
      await reloadMfaStatus();
      await refetchUser();
      toast.success("MFA berhasil dinonaktifkan.");
      return true;
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 403
          ? "Akses ditolak. Silakan login ulang lalu coba lagi."
          : err instanceof ApiError
            ? err.message
            : "Gagal menonaktifkan MFA.";
      toast.error(msg);
      return false;
    } finally {
      setMfaBusy(false);
    }
  }, [mfaPassword, mfaTotpCode, reloadMfaStatus, refetchUser]);

  const handleSwitchMfa = useCallback(async (target: "totp" | "email") => {
    const disabled = await handleDisableMfa();
    if (!disabled) return;
    if (target === "totp") {
      await handleStartTotp();
    } else {
      await handleStartEmail();
    }
  }, [handleDisableMfa, handleStartEmail, handleStartTotp]);

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
              <p className="mt-1 text-[11px] text-slate-400">
                Gunakan URL gambar untuk foto profil.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            <InlineEditField
              label="Nama Tampilan"
              value={user.name}
              onSave={handleDisplayNameSave}
            />
            <InlineEditField
              label="Foto Profil (URL)"
              value={user.avatarUrl ?? ""}
              onSave={handleAvatarSave}
            />
            <InlinePhoneField
              label="Nomor Telepon"
              value={user.phoneNumber ?? ""}
              onSave={handlePhoneSave}
            />
            <InlineEditField
              label="Alamat Pengiriman"
              value={user.shippingAddress ?? ""}
              onSave={handleAddressSave}
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
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Autentikasi Dua Faktor (2FA)</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {mfaStatus?.enabled
                    ? `2FA aktif via ${mfaStatus.method === "EMAIL" ? "Email" : "Authenticator"}.`
                    : "Aktifkan untuk lapisan keamanan tambahan."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={mfaStatus?.enabled ? "success" : "default"}>
                  {mfaStatus?.enabled ? "Aktif" : "Nonaktif"}
                </Badge>
                {mfaStatus?.enabled && (
                  <Badge 
                    variant="info" 
                    className="border border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                  >
                    {mfaStatus.method === "TOTP" ? "Authenticator" : "Email"}
                  </Badge>
                )}
              </div>
            </div>

            {mfaLoading ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : mfaStatus?.enabled ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">Matikan atau ganti metode</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Masukkan password atau kode TOTP untuk menonaktifkan/mengganti MFA.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="password"
                      value={mfaPassword}
                      onChange={(e) => setMfaPassword(e.target.value)}
                      placeholder="Password"
                      // Ditambahkan text-slate-900 agar warna teks gelap
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900" 
                    />
                    <input
                      value={mfaTotpCode}
                      onChange={(e) => setMfaTotpCode(e.target.value)}
                      placeholder="Kode TOTP"
                      // Ditambahkan text-slate-900 agar warna teks gelap
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={handleDisableMfa}
                      disabled={mfaBusy}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      type="button"
                    >
                      Matikan MFA
                    </button>
                    <button
                      onClick={() => handleSwitchMfa("totp")}
                      disabled={mfaBusy}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      type="button"
                    >
                      Ganti ke Authenticator
                    </button>
                    <button
                      onClick={() => handleSwitchMfa("email")}
                      disabled={mfaBusy}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      type="button"
                    >
                      Ganti ke Email
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sembunyikan tombol pilihan jika salah satu setup sedang aktif */}
                {!mfaAction && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleStartTotp}
                      disabled={mfaBusy}
                      className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-200 disabled:opacity-60"
                      type="button"
                    >
                      Aktifkan Authenticator
                    </button>
                    <button
                      onClick={handleStartEmail}
                      disabled={mfaBusy}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      type="button"
                    >
                      Aktifkan via Email
                    </button>
                  </div>
                )}

                {mfaAction === "totp" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-700">Scan QR Authenticator</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Scan QR di Google Authenticator/Authenticator app, lalu masukkan kode.
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      {mfaSetup ? (
                        <img
                          src={mfaSetup.qrCodeImageUri}
                          alt="QR MFA"
                          className="h-28 w-28 rounded-lg border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
                          Menyiapkan QR…
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        {mfaSetup && (
                          <p className="text-[11px] text-slate-500">
                            Secret: <span className="font-mono text-slate-700">{mfaSetup.secret}</span>
                          </p>
                        )}
                        <input
                          value={mfaCode}
                          onChange={(e) => {
                            // Format kode 123 - 456
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 6) val = val.slice(0, 6);
                            if (val.length > 3) {
                              val = `${val.slice(0, 3)} - ${val.slice(3)}`;
                            }
                            setMfaCode(val);
                          }}
                          placeholder="123 - 456"
                          // Menambahkan text-slate-900 agar warna teks terlihat
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                          inputMode="numeric"
                        />
                        <button
                          onClick={handleConfirmTotp}
                          disabled={mfaBusy}
                          className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-200 disabled:opacity-60"
                          type="button"
                        >
                          Konfirmasi Authenticator
                        </button>
                        <button
                          onClick={() => { setMfaAction(null); setMfaSetup(null); setMfaCode(""); }}
                          disabled={mfaBusy}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                          type="button"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {mfaAction === "email" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold text-slate-700">Verifikasi Email</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Kami mengirim kode ke email Anda. Masukkan kode untuk mengaktifkan MFA.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        value={mfaEmailCode}
                        onChange={(e) => setMfaEmailCode(e.target.value)}
                        placeholder="Masukkan kode email"
                        // Menambahkan text-slate-900 agar warna teks gelap
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                      />
                      <button
                        onClick={handleConfirmEmail}
                        disabled={mfaBusy}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        type="button"
                      >
                        Konfirmasi Email
                      </button>
                      <button
                        onClick={() => { setMfaAction(null); setMfaEmailCode(""); }}
                        disabled={mfaBusy}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        type="button"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
