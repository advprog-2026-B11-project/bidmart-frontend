import client from "./client";
import type {
  Order,
  UpdateTrackingRequest,
  DisputeRequest,
  ResolveDisputeRequest,
  PaginatedResponse,
} from "@/types/api";
import type { OrderStatus } from "@/constants/enums";

/** GET /api/orders/:orderId */
export async function getById(orderId: string): Promise<Order> {
  const { data } = await client.get<Order>(`/api/orders/${orderId}`);
  return data;
}

/** GET /api/orders/buyer */
export async function getByBuyer(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Order>> {
  const { data } = await client.get<PaginatedResponse<Order>>(
    "/api/orders/buyer",
    { params: { page, size } }
  );
  return data;
}

/** PATCH /api/orders/:orderId/tracking */
export async function updateTracking(
  orderId: string,
  data: UpdateTrackingRequest
): Promise<Order> {
  const { data: res } = await client.patch<Order>(
    `/api/orders/${orderId}/tracking`,
    data
  );
  return res;
}

/** PATCH /api/orders/:orderId/confirm — buyer confirms delivery */
export async function confirm(orderId: string): Promise<Order> {
  const { data } = await client.patch<Order>(`/api/orders/${orderId}/confirm`);
  return data;
}

/** POST /api/orders/:orderId/dispute */
export async function dispute(
  orderId: string,
  data: DisputeRequest
): Promise<Order> {
  const { data: res } = await client.post<Order>(
    `/api/orders/${orderId}/dispute`,
    data
  );
  return res;
}

/** PATCH /api/orders/:orderId/dispute/resolve */
export async function resolveDispute(
  orderId: string,
  data: ResolveDisputeRequest
): Promise<Order> {
  const { data: res } = await client.patch<Order>(
    `/api/orders/${orderId}/dispute/resolve`,
    data
  );
  return res;
}

/** PATCH /api/orders/:orderId/status */
export async function updateStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const { data } = await client.patch<Order>(`/api/orders/${orderId}/status`, {
    status,
  });
  return data;
}
