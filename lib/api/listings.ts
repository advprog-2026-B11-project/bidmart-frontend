import client from "./client";
import type {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchParams,
  PaginatedResponse,
} from "@/types/api";

function unwrapListing(data: unknown): Listing {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid listing response");
  }

  const record = data as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    return record.data as Listing;
  }

  return data as Listing;
}

export async function create(data: CreateListingRequest): Promise<Listing> {
  const { data: res } = await client.post<Listing>("/api/listings", data);
  return unwrapListing(res);
}

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

export async function search(
  params: ListingSearchParams
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<Listing>>(
    "/api/listings/search",
    { params }
  );
  return data;
}

export async function getById(id: string): Promise<Listing> {
  const { data } = await client.get<unknown>(`/api/listings/${id}`);
  return unwrapListing(data);
}

export async function update(
  id: string,
  data: UpdateListingRequest
): Promise<Listing> {
  const { data: res } = await client.put<Listing>(`/api/listings/${id}`, data);
  return unwrapListing(res);
}

export async function deleteListing(id: string): Promise<void> {
  await client.delete(`/api/listings/${id}`);
}