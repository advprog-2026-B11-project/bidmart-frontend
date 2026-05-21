"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import * as authApi from "@/lib/api/auth";
import * as usersApi from "@/lib/api/users";
import {
  getAccessToken,
  setTokens,
  clearTokens,
  getUser,
  setUser,
  clearUser,
} from "@/lib/api/storage";
import type { UserProfile, AuthResponse, MfaRequiredResponse } from "@/types/api";
import { UserRole } from "@/constants/enums";

interface LoginResult {
  mfaRequired: boolean;
  tempToken?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  verifyMfa: (tempToken: string, code: string) => Promise<void>;
  logout: () => void;
  register: (
    username: string,
    email: string,
    displayName: string,
    password: string,
    role: "USER" | "SELLER"
  ) => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function isMfaRequired(r: AuthResponse | MfaRequiredResponse): r is MfaRequiredResponse {
  return "mfaRequired" in r && r.mfaRequired === true;
}

function rawToProfile(raw: Record<string, unknown>): UserProfile {
  const roleStr = String(raw.role ?? "BUYER").toUpperCase();
  const role =
    roleStr === "SELLER" ? UserRole.SELLER :
    roleStr === "ADMIN"  ? UserRole.ADMIN  :
                           UserRole.BUYER;
  const now = new Date().toISOString();
  return {
    id:              String(raw.id ?? ""),
    name:            String(raw.displayName ?? raw.name ?? raw.username ?? ""),
    email:           String(raw.email ?? ""),
    avatarUrl:       (raw.imageUrl ?? raw.avatarUrl ?? null) as string | null,
    role,
    phoneNumber:     (raw.phoneNumber ?? null) as string | null,
    shippingAddress: (raw.shippingAddress ?? null) as string | null,
    mfaEnabled:      Boolean(raw.mfaEnabled ?? raw.isMfaEnabled ?? false),
    createdAt:       String(raw.createdAt ?? now),
    updatedAt:       String(raw.updatedAt ?? now),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      console.log("[AuthProvider] mount — hydrating from storage");
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      setAccessToken(token);
      const stored = getUser();
      if (stored) setUserState(stored);

      try {
        const profile = await usersApi.getMyProfile();
        setUserState(profile);
        setUser(profile);
      } catch {
        // stored user is already set above; only clear if there was nothing stored
        if (!stored) {
          setUserState(null);
          setAccessToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    hydrate();
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<LoginResult> => {
      const result = await authApi.login(identifier, password);
      if (isMfaRequired(result)) {
        return { mfaRequired: true, tempToken: result.tempToken };
      }
      setTokens(result.accessToken, result.refreshToken);
      setAccessToken(result.accessToken);
      const rawUser = result.user as unknown as Record<string, unknown> | undefined | null;
      if (rawUser) {
        const immediate = rawToProfile(rawUser);
        setUserState(immediate);
        setUser(immediate);
      }
      try {
        const profile = await usersApi.getMyProfile();
        setUser(profile);
        setUserState(profile);
      } catch {
        // keep the immediate profile from auth response if getMyProfile fails
      }
      return { mfaRequired: false };
    },
    []
  );

  const verifyMfa = useCallback(
    async (tempToken: string, code: string): Promise<void> => {
      const result = await authApi.verifyMfa(tempToken, code);
      setTokens(result.accessToken, result.refreshToken);
      setAccessToken(result.accessToken);
      const profile = await usersApi.getMyProfile();
      setUser(profile);
      setUserState(profile);
    },
    []
  );

  const logout = useCallback((): void => {
    clearTokens();
    clearUser();
    setUserState(null);
    setAccessToken(null);
    router.push("/auth/login");
  }, [router]);

  const register = useCallback(
    async (
      username: string,
      email: string,
      displayName: string,
      password: string,
      role: "USER" | "SELLER"
    ): Promise<void> => {
      await authApi.register({ username, email, displayName, password, role });
    },
    []
  );

  const refetchUser = useCallback(async (): Promise<void> => {
    const profile = await usersApi.getMyProfile();
    setUserState(profile);
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading,
      login,
      verifyMfa,
      logout,
      register,
      refetchUser,
    }),
    [user, accessToken, isLoading, login, verifyMfa, logout, register, refetchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
