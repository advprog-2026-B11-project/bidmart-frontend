"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import type { UserRole } from "@/constants/enums";

interface AuthGuardProps {
  children: React.ReactNode;
  mode: "auth-required" | "guest-only" | "role";
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, mode, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const isRoleBlocked =
    mode === "role" &&
    !isLoading &&
    !!user &&
    !!allowedRoles &&
    !allowedRoles.includes(user.role);

  useEffect(() => {
    if (isLoading) return;

    if (mode === "auth-required" && !isAuthenticated) {
      router.replace("/auth/login");
    } else if (mode === "guest-only" && isAuthenticated) {
      router.replace("/");
    } else if (isRoleBlocked) {
      toast.error("Anda tidak memiliki akses ke halaman ini", { id: "role-blocked-error" });
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, mode, isRoleBlocked, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (mode === "auth-required" && !isAuthenticated) return null;
  if (mode === "guest-only" && isAuthenticated) return null;
  if (isRoleBlocked) return null;

  return <>{children}</>;
}
