import client from "./client";
import { UserRole } from "@/constants/enums";
import type {
  UserProfile,
  UpdateProfileRequest,
  MfaDisableRequest,
  MfaEmailVerifyRequest,
  MfaEnableRequest,
  MfaSetupResponse,
  MfaStatusResponse,
} from "@/types/api";

interface BackendUserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  imageUrl?: string | null;
  phoneNumber?: string | null;
  shippingAddress?: string | null;
  role?: string;
  mfaEnabled?: boolean;
  isMfaEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function mapRole(role?: string): UserRole {
  if (role === "SELLER") return UserRole.SELLER;
  if (role === "ADMIN") return UserRole.ADMIN;
  return UserRole.BUYER;
}

function normalizeUser(data: BackendUserProfile): UserProfile {
  let avatar = data.imageUrl ?? null;
  if (avatar && avatar.includes("example.com")) {
    avatar = null;
  }
  return {
    id: data.id,
    name: data.displayName || data.username,
    email: data.email,
    avatarUrl: avatar,
    role: mapRole(data.role),
    phoneNumber: data.phoneNumber ?? null,
    shippingAddress: data.shippingAddress ?? null,
    mfaEnabled: data.mfaEnabled ?? data.isMfaEnabled ?? false,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

function mapUserProfile(data: BackendUserProfile): UserProfile {
  return normalizeUser(data);
}

/** GET /api/users/me */
export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await client.get<BackendUserProfile>("/api/users/me");
  return mapUserProfile(data);
}

/** PUT /api/users/me */
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<UserProfile> {
  const { data: res } = await client.put<BackendUserProfile>("/api/users/me", data);
  return mapUserProfile(res);
}

/** DELETE /api/users/me */
export async function deleteAccount(): Promise<void> {
  await client.delete("/api/users/me");
}

/** GET /api/users/me/mfa */
export async function getMfaStatus(): Promise<MfaStatusResponse> {
  const { data } = await client.get<MfaStatusResponse>("/api/users/me/mfa");
  return data;
}

/** POST /api/users/me/mfa/setup */
export async function setupMfa(): Promise<MfaSetupResponse> {
  const { data } = await client.post<MfaSetupResponse>("/api/users/me/mfa/setup");
  return data;
}

/** POST /api/users/me/mfa/enable */
export async function enableMfa(code: string): Promise<MfaStatusResponse> {
  const body: MfaEnableRequest = { code };
  const { data } = await client.post<MfaStatusResponse>("/api/users/me/mfa/enable", body);
  return data;
}

/** POST /api/users/me/mfa/email/enable */
export async function enableEmailMfa(): Promise<MfaStatusResponse> {
  const { data } = await client.post<MfaStatusResponse>("/api/users/me/mfa/email/enable");
  return data;
}

/** POST /api/users/me/mfa/email/verify */
export async function verifyEmailMfa(code: string): Promise<MfaStatusResponse> {
  const body: MfaEmailVerifyRequest = { code };
  const { data } = await client.post<MfaStatusResponse>("/api/users/me/mfa/email/verify", body);
  return data;
}

/** POST /api/users/me/mfa/disable */
export async function disableMfa(payload: MfaDisableRequest): Promise<MfaStatusResponse> {
  const { data } = await client.post<MfaStatusResponse>("/api/users/me/mfa/disable", payload);
  return data;
}
