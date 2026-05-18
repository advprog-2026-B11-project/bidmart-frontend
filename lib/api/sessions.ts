import client from "./client";
import type { DeviceSession } from "@/types/api";

/** GET /api/users/sessions — list active device sessions */
export async function list(): Promise<DeviceSession[]> {
  const { data } = await client.get<DeviceSession[]>("/api/users/sessions");
  return data;
}

/** DELETE /api/users/sessions/:sessionId — revoke a session */
export async function revoke(sessionId: string): Promise<void> {
  await client.delete(`/api/users/sessions/${sessionId}`);
}
