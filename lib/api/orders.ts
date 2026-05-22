import apiClient from './client';

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: string;
  trackingNumber?: string;
  disputeReason?: string;
  createdAt: string;
}

export const orderApi = {
  getOrdersByUser: async (userId: string): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(`/api/orders/user/${userId}`);
    return response.data;
  },

  updateTrackingNumber: async (orderId: string, requesterId: string, trackingNumber: string): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/api/orders/${orderId}/tracking`, {
      requesterId,
      trackingNumber,
    });
    return response.data;
  },

  confirmDelivery: async (orderId: string, requesterId: string): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/api/orders/${orderId}/confirm`, {
      requesterId,
    });
    return response.data;
  },

  disputeOrder: async (orderId: string, requesterId: string, reason: string): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/api/orders/${orderId}/dispute`, {
      requesterId,
      reason,
    });
    return response.data;
  },
};