import client from "./client";
import type { Bid, PlaceBidRequest, MinimumBidResponse, PaginatedResponse } from "@/types/api";

/** POST /api/bids — place a bid; idempotencyKey prevents duplicate submissions */
export async function place(
  data: PlaceBidRequest,
  idempotencyKey: string
): Promise<Bid> {
  const { data: res } = await client.post<Bid>("/api/bids", data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return res;
}

/** GET /api/bids/listing/:listingId */
export async function getByListing(
  listingId: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse<Bid>> {
  const { data } = await client.get<PaginatedResponse<Bid>>(
    `/api/bids/listing/${listingId}`,
    { params: { page, size } }
  );
  return data;
}

/** GET /api/bids/listing/:listingId/highest */
export async function getHighest(listingId: string): Promise<Bid> {
  const { data } = await client.get<Bid>(
    `/api/bids/listing/${listingId}/highest`
  );
  return data;
}

/** GET /api/bids/listing/:listingId/minimum */
export async function getMinimumBid(
  listingId: string
): Promise<MinimumBidResponse> {
  const { data } = await client.get<MinimumBidResponse>(
    `/api/bids/listing/${listingId}/minimum`
  );
  return data;
}

/** GET /api/bids/my */
export async function getMyBids(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Bid>> {
  const { data } = await client.get<PaginatedResponse<Bid>>("/api/bids/my", {
    params: { page, size },
  });
  return data;
}

/** GET /api/bids/buyer/:buyerId */
export async function getByBuyer(
  buyerId: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse<Bid>> {
  const { data } = await client.get<PaginatedResponse<Bid>>(
    `/api/bids/buyer/${buyerId}`,
    { params: { page, size } }
  );
  return data;
}
