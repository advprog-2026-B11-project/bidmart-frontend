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
  register: (name: string, email: string, password: string) => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function isMfaRequired(r: AuthResponse | MfaRequiredResponse): r is MfaRequiredResponse {
  return "mfaRequired" in r && r.mfaRequired === true;
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
        setUserState(null);
        setAccessToken(null);
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
      setUser(result.user);
      setUserState(result.user);
      return { mfaRequired: false };
    },
    []
  );

  const verifyMfa = useCallback(
    async (tempToken: string, code: string): Promise<void> => {
      const result = await authApi.verifyMfa(tempToken, code);
      setTokens(result.accessToken, result.refreshToken);
      setAccessToken(result.accessToken);
      setUser(result.user);
      setUserState(result.user);
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
    async (name: string, email: string, password: string): Promise<void> => {
      await authApi.register({ name, email, password });
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
