"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/constants/routes";
import { UserRole } from "@/constants/enums";

const loginSchema = z.object({
  identifier: z.string().min(3, "Minimal 3 karakter"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    try {
      const result = await login(data.identifier, data.password);
      if (result.mfaRequired) {
        router.push(`${ROUTES.AUTH.MFA}?token=${result.tempToken}`);
        return;
      }
      toast.success("Selamat datang kembali!");
      router.push(result.role === UserRole.ADMIN ? ROUTES.ADMIN.USERS : ROUTES.HOME);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login gagal. Coba lagi.";
      toast.error(msg);
    }
  }

  return (
    <Card variant="elevated" className="rounded-2xl shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">Masuk ke BidMart</CardTitle>
        <CardDescription>Masukkan akun Anda untuk melanjutkan</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* identifier */}
          <div>
            <Input
              label="Username atau Email"
              placeholder="username atau email@contoh.com"
              autoComplete="username"
              aria-invalid={!!errors.identifier}
              className={
                errors.identifier
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }
              {...register("identifier")}
            />
            {errors.identifier && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.identifier.message}
              </p>
            )}
          </div>

          {/* password */}
          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className={
                errors.password
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => alert("Coming soon")}
              className="text-xs text-blue-700 hover:underline focus:outline-none focus-visible:underline"
            >
              Lupa password?
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
          >
            Masuk
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link
            href={ROUTES.AUTH.REGISTER}
            className="font-medium text-blue-700 hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <AuthGuard mode="guest-only">
      <LoginForm />
    </AuthGuard>
  );
}
