"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError } from "@/lib/api/client";
import { verifyEmail, resendVerification } from "@/lib/api/auth";
import { ROUTES } from "@/constants/routes";

type State = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "loading" : "no-token");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendIdentifier, setResendIdentifier] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const didRun = useRef(false);

  useEffect(() => {
    if (!token || didRun.current) return;
    didRun.current = true;

    verifyEmail(token)
      .then(() => setState("success"))
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : "Tautan verifikasi tidak valid atau sudah kedaluwarsa.";
        setErrorMessage(msg);
        setState("error");
      });
  }, [token]);

  async function handleResend() {
    const id = resendIdentifier.trim();
    if (!id) {
      toast.error("Masukkan email atau username Anda.");
      return;
    }
    setIsResending(true);
    try {
      await resendVerification(id);
      setResendSent(true);
      toast.success("Email verifikasi telah dikirim ulang.");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengirim ulang email verifikasi.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Memverifikasi email Anda…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="h-14 w-14 text-green-500" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Email Berhasil Diverifikasi</h2>
          <p className="mt-1 text-sm text-slate-500">Akun Anda sudah aktif. Silakan masuk untuk melanjutkan.</p>
        </div>
        <Link href={ROUTES.AUTH.LOGIN}>
          <Button className="mt-2 w-full">Masuk Sekarang</Button>
        </Link>
      </div>
    );
  }

  if (state === "no-token") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Mail className="h-14 w-14 text-slate-400" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Verifikasi Email</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tidak ada token ditemukan. Silakan cek inbox Anda dan klik tautan verifikasi.
          </p>
        </div>
        <ResendForm
          identifier={resendIdentifier}
          onIdentifierChange={setResendIdentifier}
          onResend={handleResend}
          isResending={isResending}
          resendSent={resendSent}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <XCircle className="h-14 w-14 text-red-500" />
      <div>
        <h2 className="text-xl font-bold text-slate-900">Verifikasi Gagal</h2>
        <p className="mt-1 text-sm text-slate-500">{errorMessage}</p>
      </div>
      <ResendForm
        identifier={resendIdentifier}
        onIdentifierChange={setResendIdentifier}
        onResend={handleResend}
        isResending={isResending}
        resendSent={resendSent}
      />
    </div>
  );
}

interface ResendFormProps {
  identifier: string;
  onIdentifierChange: (v: string) => void;
  onResend: () => void;
  isResending: boolean;
  resendSent: boolean;
}

function ResendForm({ identifier, onIdentifierChange, onResend, isResending, resendSent }: ResendFormProps) {
  if (resendSent) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Email verifikasi telah dikirim. Cek inbox Anda.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 pt-2">
      <p className="text-xs text-slate-400">Kirim ulang tautan verifikasi</p>
      <input
        type="text"
        placeholder="Email atau username"
        value={identifier}
        onChange={(e) => onIdentifierChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <Button
        onClick={onResend}
        disabled={isResending}
        variant="outline"
        className="w-full"
      >
        {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Kirim Ulang Email Verifikasi
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
