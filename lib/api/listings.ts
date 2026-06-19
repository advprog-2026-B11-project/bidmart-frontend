import client from "./client";
import type {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchParams,
  PaginatedResponse,
  Category,
  UserProfile,
} from "@/types/api";

type BackendListing = {
  id?: string;
  sellerId?: string;
  categoryId?: string;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  startingPrice?: number;
  reservePrice?: number | null;
  endTime?: string;
  status?: Listing["status"];
  auctionType?: string;
  currentHighestBid?: number | null;
  currentHighestBidderId?: string | null;
  createdAt?: string;
  category?: Partial<Category>;
  seller?: UserProfile;
};

type ListingPayloadSource = CreateListingRequest | UpdateListingRequest;

function fallbackCategory(categoryId = ""): Category {
  return {
    id: categoryId,
    name: "Kategori",
    slug: categoryId,
    description: null,
    imageUrl: null,
  };
}

function normalizeListing(raw: BackendListing): Listing {
  const categoryId = raw.categoryId ?? raw.category?.id ?? "";
  const imageUrl = raw.imageUrl && !raw.imageUrl.includes("example.com")
    ? raw.imageUrl
    : null;
  const currentPrice = raw.currentHighestBid ?? raw.startingPrice ?? 0;
  const endAt = raw.endTime ?? "";

  return {
    id: raw.id ?? "",
    title: raw.title ?? "",
    description: raw.description ?? "",
    imageUrls: imageUrl ? [imageUrl] : [],
    startingPrice: raw.startingPrice ?? 0,
    currentPrice,
    reservePrice: raw.reservePrice ?? null,
    buyNowPrice: null,
    status: raw.status ?? "ACTIVE",
    categoryId,
    category: raw.category?.id ? (raw.category as Category) : fallbackCategory(categoryId),
    sellerId: raw.sellerId,
    seller: raw.seller,
    totalBids: raw.currentHighestBid ? 1 : 0,
    currentHighestBidderId: raw.currentHighestBidderId ?? undefined,
    startAt: raw.createdAt ?? "",
    endAt,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.createdAt ?? "",
  };
}

function normalizePage(data: PaginatedResponse<BackendListing>): PaginatedResponse<Listing> {
  return {
    ...data,
    content: (data.content ?? []).map(normalizeListing),
  };
}

function toBackendPayload(data: ListingPayloadSource) {
  const imageUrl = data.imageUrls?.[0] ?? "";
  const endTime = (data as UpdateListingRequest).endTime ?? data.endAt;

  return {
    categoryId: data.categoryId,
    title: data.title,
    description: data.description,
    imageUrl,
    startingPrice: data.startingPrice,
    reservePrice: data.reservePrice,
    endTime,
    auctionType: "ENGLISH",
  };
}

function unwrapListing(data: unknown): BackendListing {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid listing response");
  }

  const record = data as Record<string, unknown>;
  if (record.data && typeof record.data === "object") {
    return record.data as BackendListing;
  }

  return data as BackendListing;
}

export async function create(data: CreateListingRequest): Promise<Listing> {
  const { data: res } = await client.post<BackendListing>("/api/listings", toBackendPayload(data));
  return normalizeListing(res);
}

export async function getAll(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<BackendListing>>(
    "/api/listings",
    { params: { page, size } }
  );
  return normalizePage(data);
}

export async function getActive(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<BackendListing>>(
    "/api/listings/active",
    { params: { page, size } }
  );
  return normalizePage(data);
}

export async function search(
  params: ListingSearchParams
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<BackendListing>>(
    "/api/listings/search",
    { params }
  );
  return normalizePage(data);
}

export async function getById(id: string): Promise<Listing> {
  const { data } = await client.get<unknown>(`/api/listings/${id}`);
  return normalizeListing(unwrapListing(data));
}

export async function update(
  id: string,
  data: UpdateListingRequest
): Promise<Listing> {
  const { data: res } = await client.put<BackendListing>(
    `/api/listings/${id}`,
    toBackendPayload(data)
  );
  return normalizeListing(res);
}

export async function deleteListing(id: string): Promise<void> {
  await client.delete(`/api/listings/${id}`);
}
