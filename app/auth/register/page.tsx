"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Minimal 3 karakter")
      .max(50, "Maksimal 50 karakter")
      .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore"),
    email: z.string().email("Format email tidak valid"),
    displayName: z
      .string()
      .min(1, "Nama tampilan wajib diisi")
      .max(100, "Maksimal 100 karakter"),
    role: z.enum(["BUYER", "SELLER"] as const, {
      message: "Role wajib dipilih",
    }),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

type Strength = "lemah" | "sedang" | "kuat";

function calcStrength(pw: string): Strength | null {
  if (!pw) return null;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) =>
    r.test(pw)
  ).length;
  if (pw.length < 8 || variety <= 1) return "lemah";
  if (pw.length >= 12 && variety >= 3) return "kuat";
  return "sedang";
}

const strengthMap: Record<Strength, { label: string; bar: string; width: string }> = {
  lemah: { label: "Lemah", bar: "bg-red-500", width: "w-1/3" },
  sedang: { label: "Sedang", bar: "bg-yellow-500", width: "w-2/3" },
  kuat: { label: "Kuat", bar: "bg-green-500", width: "w-full" },
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = calcStrength(password);
  if (!strength) return null;
  const { label, bar, width } = strengthMap[strength];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={cn("h-full rounded-full transition-all duration-300", bar, width)} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "BUYER" },
  });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });

  async function onSubmit(data: RegisterForm) {
    try {
      await registerUser(data.username, data.email, data.displayName, data.password, data.role);
      toast.success("Akun berhasil dibuat! Silakan login.");
      router.push(ROUTES.AUTH.LOGIN);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registrasi gagal. Coba lagi.";
      toast.error(msg);
    }
  }

  return (
    <Card variant="elevated" className="rounded-2xl shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl">Buat Akun</CardTitle>
        <CardDescription>Bergabung dengan BidMart dan mulai lelang</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* username */}
          <div>
            <Input
              label="Username"
              placeholder="nama_pengguna"
              autoComplete="username"
              aria-invalid={!!errors.username}
              className={
                errors.username ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
              }
              {...register("username")}
            />
            {errors.username && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.username.message}
              </p>
            )}
          </div>

          {/* email */}
          <div>
            <Input
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={
                errors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
              }
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* displayName */}
          <div>
            <Input
              label="Nama Tampilan"
              placeholder="Nama lengkap Anda"
              autoComplete="name"
              aria-invalid={!!errors.displayName}
              className={
                errors.displayName
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.displayName.message}
              </p>
            )}
          </div>

          {/* role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Peran</Label>
            <select
              id="role"
              aria-invalid={!!errors.role}
              className={cn(
                "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900",
                "placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-50",
                "border-slate-300 dark:border-slate-700",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "transition-colors duration-150",
                errors.role && "border-red-500 focus:ring-red-500 focus:border-red-500"
              )}
              {...register("role")}
            >
              <option value="BUYER">Pembeli</option>
              <option value="SELLER">Penjual</option>
            </select>
            {errors.role && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.role.message}
              </p>
            )}
          </div>

          {/* password */}
          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className={
                errors.password ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""
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
            <PasswordStrengthBar password={passwordValue} />
            {errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* confirmPassword */}
          <div>
            <Input
              label="Konfirmasi Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className={
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                  className="hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
          >
            Buat Akun
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Sudah punya akun?{" "}
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <AuthGuard mode="guest-only">
      <RegisterForm />
    </AuthGuard>
  );
}
