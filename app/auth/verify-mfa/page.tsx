"use client";

import { Suspense, useRef, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

/* ── OTP form ────────────────────────────────────────────────────────────── */

function VerifyMfaForm({ tempToken }: { tempToken: string }) {
  const router = useRouter();
  const { verifyMfa } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const submitLock = useRef(false);

  /* countdown timer */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const submit = useCallback(
    async (code: string) => {
      if (submitLock.current) return;
      submitLock.current = true;
      setIsSubmitting(true);
      try {
        await verifyMfa(tempToken, code);
        toast.success("Verifikasi berhasil!");
        router.push(ROUTES.HOME);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Kode tidak valid. Coba lagi.";
        toast.error(msg);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        submitLock.current = false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [verifyMfa, tempToken, router]
  );

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      submit(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!raw) return;
    const next = Array(OTP_LENGTH)
      .fill("")
      .map((_, i) => raw[i] ?? "");
    setDigits(next);
    const focusIdx = Math.min(raw.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (raw.length === OTP_LENGTH) submit(raw);
  }

  function handleManualSubmit() {
    const code = digits.join("");
    if (code.length === OTP_LENGTH && !digits.includes("")) {
      submit(code);
    }
  }

  function handleResend() {
    setCountdown(RESEND_SECONDS);
    toast.info("Kode baru telah dikirim ke perangkat Anda.");
  }

  const isFilled = digits.every((d) => d !== "");

  return (
    <Card variant="elevated" className="rounded-2xl shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">Verifikasi Dua Langkah</CardTitle>
        <CardDescription>
          Masukkan 6-digit kode yang dikirim ke perangkat Anda
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* OTP boxes */}
          <div
            className="flex justify-between gap-2"
            role="group"
            aria-label="Kode OTP 6 digit"
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                aria-label={`Digit ke-${i + 1}`}
                disabled={isSubmitting}
                autoFocus={i === 0}
                className={cn(
                  "h-12 w-12 rounded-xl border-2 text-center text-xl font-semibold",
                  "bg-white text-slate-900",
                  "transition-all duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  digit
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200"
                )}
              />
            ))}
          </div>

          <Button
            size="lg"
            loading={isSubmitting}
            disabled={!isFilled || isSubmitting}
            onClick={handleManualSubmit}
            className="w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
          >
            Verifikasi
          </Button>

          {/* Resend countdown */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-slate-500">
                Kirim ulang kode dalam{" "}
                <span className="tabular-nums font-semibold text-blue-700">
                  {countdown}s
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:underline"
              >
                Kirim ulang kode
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Search-params reader (needs Suspense boundary) ──────────────────────── */

function VerifyMfaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get("token");

  useEffect(() => {
    if (!tempToken) router.replace(ROUTES.AUTH.LOGIN);
  }, [tempToken, router]);

  if (!tempToken) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return <VerifyMfaForm tempToken={tempToken} />;
}

/* ── Page export ─────────────────────────────────────────────────────────── */

export default function VerifyMfaPage() {
  return (
    <AuthGuard mode="guest-only">
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <VerifyMfaContent />
      </Suspense>
    </AuthGuard>
  );
}
