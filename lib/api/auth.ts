import client from "./client";
import type {
  RegisterRequest,
  AuthResponse,
  LoginResponse,
  LoginMfaRequest,
} from "@/types/api";

/** POST /api/auth/register */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const { data: res } = await client.post<AuthResponse>(
    "/api/auth/register",
    data
  );
  return res;
}

/** POST /api/auth/login — returns full AuthResponse or MFA challenge */
export async function login(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  const { data: res } = await client.post<LoginResponse>("/api/auth/login", {
    identifier,
    password,
  });
  return res;
}

/** POST /api/auth/verify-mfa — exchange tempToken + code for full tokens */
export async function verifyMfa(
  tempToken: string,
  code: string
): Promise<AuthResponse> {
  const body: LoginMfaRequest = { tempToken, code };
  const { data: res } = await client.post<AuthResponse>(
    "/api/auth/verify-mfa",
    body
  );
  return res;
}

/** POST /api/auth/refresh — get new token pair */
export async function refresh(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data: res } = await client.post<{
    accessToken: string;
    refreshToken: string;
  }>("/api/auth/refresh", { refreshToken });
  return res;
}

/** POST /api/auth/verify-email — confirm email with token from link */
export async function verifyEmail(token: string): Promise<void> {
  await client.post("/api/auth/verify-email", { token });
}
