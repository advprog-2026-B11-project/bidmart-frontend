import client from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  deliveryStatus: string;
  createdAt: string;
}

export interface NotificationPreference {
  id?: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  mutedTypes: string[];
}

/** Helper to parse Java LocalDateTime Array to ISO String */
function normalizeNotification(notif: any): Notification {
  if (!notif) return notif;
  let dateStr = notif.createdAt;
  if (Array.isArray(dateStr)) {
    const [y, m, d, h = 0, min = 0, s = 0, ns = 0] = dateStr;
    const pad = (n: number) => String(n).padStart(2, "0");
    const ms = Math.floor(ns / 1_000_000);
    dateStr = `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}.${String(ms).padStart(3, "0")}`;
  }
  return { ...notif, createdAt: dateStr };
}

export const notificationApi = {
  getUserNotifications: async (userId: string): Promise<Notification[]> => {
    const response = await client.get<any[]>(`/api/notifications/user/${userId}`);
    return response.data.map(normalizeNotification);
  },

  getUnreadNotifications: async (userId: string): Promise<Notification[]> => {
    const response = await client.get<any[]>(`/api/notifications/user/${userId}/unread`);
    return response.data.map(normalizeNotification);
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await client.patch<any>(`/api/notifications/${notificationId}/read`);
    return normalizeNotification(response.data);
  },

  markAllAsRead: async (userId: string): Promise<{ message: string }> => {
    const response = await client.patch<{ message: string }>(`/api/notifications/user/${userId}/read-all`);
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<{ message: string }> => {
    const response = await client.delete<{ message: string }>(`/api/notifications/${notificationId}`);
    return response.data;
  },

  getPreferences: async (userId: string): Promise<NotificationPreference> => {
    const response = await client.get<NotificationPreference>(`/api/notifications/user/${userId}/preferences`);
    return response.data;
  },

  updatePreferences: async (userId: string, data: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await client.put<NotificationPreference>(`/api/notifications/user/${userId}/preferences`, data);
    return response.data;
  }
};