import client from "./client";
import type { DeviceSession } from "@/types/api";

type RawSession = Record<string, unknown>;

function mapSession(raw: RawSession): DeviceSession {
  return {
    id: String(raw.id ?? raw.sessionId ?? ""),
    deviceInfo: String(raw.deviceInfo ?? raw.userAgent ?? raw.device ?? "Unknown Device"),
    ipAddress: String(raw.ipAddress ?? raw.ip ?? "—"),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    lastActiveAt: String(raw.lastActiveAt ?? raw.lastUsedAt ?? raw.lastActive ?? raw.last_active_at ?? new Date().toISOString()),
    current: Boolean(raw.current ?? raw.isCurrent ?? raw.isCurrentSession ?? false),
  };
}

/** GET /api/sessions — list active device sessions */
export async function list(): Promise<DeviceSession[]> {
  const { data } = await client.get<RawSession[]>("/api/sessions");
  const sessions = Array.isArray(data) ? data : [];
  return sessions.map(mapSession);
}

/** DELETE /api/sessions/:sessionId — revoke a session */
export async function revoke(sessionId: string): Promise<void> {
  await client.delete(`/api/sessions/${sessionId}`);
}
