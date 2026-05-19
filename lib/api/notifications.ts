import client from "./client";
import type {
  Notification,
  NotificationPreferences,
  PaginatedResponse,
} from "@/types/api";

/** GET /api/notifications */
export async function getByUser(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Notification>> {
  const { data } = await client.get<PaginatedResponse<Notification>>(
    "/api/notifications",
    { params: { page, size } }
  );
  return data;
}

/** GET /api/notifications/unread */
export async function getUnread(): Promise<Notification[]> {
  const { data } = await client.get<Notification[]>(
    "/api/notifications/unread"
  );
  return data;
}

/** PATCH /api/notifications/:id/read */
export async function markRead(id: string): Promise<void> {
  await client.patch(`/api/notifications/${id}/read`);
}

/** PATCH /api/notifications/read-all */
export async function markAllRead(): Promise<void> {
  await client.patch("/api/notifications/read-all");
}

/** DELETE /api/notifications/:id */
export async function deleteNotification(id: string): Promise<void> {
  await client.delete(`/api/notifications/${id}`);
}

/** GET /api/notifications/preferences */
export async function getPreferences(): Promise<NotificationPreferences> {
  const { data } = await client.get<NotificationPreferences>(
    "/api/notifications/preferences"
  );
  return data;
}

/** PATCH /api/notifications/preferences */
export async function updatePreferences(
  data: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const { data: res } = await client.patch<NotificationPreferences>(
    "/api/notifications/preferences",
    data
  );
  return res;
}
