import client from "./client";
import type {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchParams,
  PaginatedResponse,
} from "@/types/api";

/** POST /api/listings */
export async function create(data: CreateListingRequest): Promise<Listing> {
  const { data: res } = await client.post<Listing>("/api/listings", data);
  return res;
}

/** GET /api/listings */
export async function getAll(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<Listing>>(
    "/api/listings",
    { params: { page, size } }
  );
  return data;
}

/** GET /api/listings/active */
export async function getActive(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<Listing>>(
    "/api/listings/active",
    { params: { page, size } }
  );
  return data;
}

/** GET /api/listings/search?keyword=&category=&minPrice=&maxPrice= */
export async function search(
  params: ListingSearchParams
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<Listing>>(
    "/api/listings/search",
    { params }
  );
  return data;
}

/** GET /api/listings/:id */
export async function getById(id: string): Promise<Listing> {
  const { data } = await client.get<Listing>(`/api/listings/${id}`);
  return data;
}

/** PATCH /api/listings/:id */
export async function update(
  id: string,
  data: UpdateListingRequest
): Promise<Listing> {
  const { data: res } = await client.patch<Listing>(
    `/api/listings/${id}`,
    data
  );
  return res;
}

/** DELETE /api/listings/:id */
export async function deleteListing(id: string): Promise<void> {
  await client.delete(`/api/listings/${id}`);
}
