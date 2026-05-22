import client from "./client";
import type {
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchParams,
  PaginatedResponse,
  Category,
} from "@/types/api";

type BackendListing = Omit<Partial<Listing>, "category"> & {
  category?: Partial<Category>;
  categoryId?: string;
  sellerId?: string;
  imageUrl?: string | null;
  endTime?: string;
  currentHighestBid?: number | null;
};

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
  const imageUrls = raw.imageUrls ?? (raw.imageUrl ? [raw.imageUrl] : []);
  const currentPrice = raw.currentPrice ?? raw.currentHighestBid ?? raw.startingPrice ?? 0;
  const endAt = raw.endAt ?? raw.endTime ?? "";
  const categoryId = raw.categoryId ?? raw.category?.id ?? "";

  return {
    ...raw,
    id: raw.id ?? "",
    sellerId: raw.sellerId ?? raw.seller?.id ?? "",
    categoryId,
    title: raw.title ?? "",
    description: raw.description ?? "",
    imageUrl: raw.imageUrl ?? imageUrls[0] ?? null,
    imageUrls,
    startingPrice: raw.startingPrice ?? 0,
    currentPrice,
    currentHighestBid: raw.currentHighestBid ?? null,
    reservePrice: raw.reservePrice ?? null,
    buyNowPrice: raw.buyNowPrice ?? null,
    status: raw.status ?? "ACTIVE",
    category: raw.category?.id ? (raw.category as Category) : fallbackCategory(categoryId),
    seller: raw.seller,
    totalBids: raw.totalBids ?? (raw.currentHighestBid ? 1 : 0),
    currentHighestBidderId: raw.currentHighestBidderId,
    startAt: raw.startAt ?? raw.createdAt ?? "",
    endAt,
    endTime: raw.endTime ?? endAt,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? raw.createdAt ?? "",
  } as Listing;
}

function normalizePage(data: PaginatedResponse<BackendListing>): PaginatedResponse<Listing> {
  return {
    ...data,
    content: (data.content ?? []).map(normalizeListing),
  };
}

function toBackendPayload(data: CreateListingRequest | UpdateListingRequest) {
  return {
    ...data,
    imageUrl: data.imageUrls?.[0],
    endTime: (data as UpdateListingRequest).endTime ?? data.endAt,
    imageUrls: undefined,
    startAt: undefined,
    endAt: undefined,
  };
}

/** POST /api/listings */
export async function create(data: CreateListingRequest): Promise<Listing> {
  const { data: res } = await client.post<BackendListing>("/api/listings", toBackendPayload(data));
  return normalizeListing(res);
}

/** GET /api/listings */
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

/** GET /api/listings/active */
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

/** GET /api/listings/search?keyword=&category=&minPrice=&maxPrice= */
export async function search(
  params: ListingSearchParams
): Promise<PaginatedResponse<Listing>> {
  const { data } = await client.get<PaginatedResponse<BackendListing>>(
    "/api/listings/search",
    { params }
  );
  return normalizePage(data);
}

/** GET /api/listings/:id */
export async function getById(id: string): Promise<Listing> {
  const { data } = await client.get<unknown>(`/api/listings/${id}`);
  if (!data || typeof data !== "object") throw new Error("Invalid response");
  // Handle backends that wrap single-entity responses under a "data" key
  const raw =
    "data" in (data as Record<string, unknown>) &&
    typeof (data as Record<string, unknown>).data === "object"
      ? ((data as Record<string, unknown>).data as BackendListing)
      : (data as BackendListing);
  return normalizeListing(raw);
}

/** PATCH /api/listings/:id */
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

/** DELETE /api/listings/:id */
export async function deleteListing(id: string): Promise<void> {
  await client.delete(`/api/listings/${id}`);
}
