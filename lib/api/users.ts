import client from "./client";
import type { UserProfile, UpdateProfileRequest } from "@/types/api";

/** GET /api/users/me */
export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>("/api/users/me");
  return data;
}

/** PATCH /api/users/me */
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<UserProfile> {
  const { data: res } = await client.patch<UserProfile>("/api/users/me", data);
  return res;
}

/** DELETE /api/users/me */
export async function deleteAccount(): Promise<void> {
  await client.delete("/api/users/me");
}
