import { BID_API_BASE_URL } from "./config";
import { Bid, CreateBidPayload, Listing, UpdateWalletPayload, Wallet } from "./types";

class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function unwrapPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const wrappedKeys = ["data", "result", "payload"];
  for (const key of wrappedKeys) {
    const candidate = payload[key];
    if (candidate !== undefined) {
      return candidate;
    }
  }

  return payload;
}

function extractArray(payload: unknown): unknown[] {
  const unwrapped = unwrapPayload(payload);
  if (Array.isArray(unwrapped)) {
    return unwrapped;
  }

  if (!isRecord(unwrapped)) {
    return [];
  }

  const collectionKeys = ["items", "content", "listings", "bids", "wallets"];
  for (const key of collectionKeys) {
    const candidate = unwrapped[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractObject(payload: unknown): Record<string, unknown> | null {
  const unwrapped = unwrapPayload(payload);
  if (isRecord(unwrapped)) {
    return unwrapped;
  }

  return null;
}

function fallbackTitle(listingId: string): string {
  if (listingId.length <= 10) {
    return `Listing ${listingId}`;
  }

  return `Listing ${listingId.slice(0, 8)}`;
}

function normalizeListing(payload: unknown): Listing | null {
  const record = extractObject(payload);
  if (!record) {
    return null;
  }

  const listingId = pickString(record, ["listingId", "id", "listing_id"]);
  if (!listingId) {
    return null;
  }

  return {
    listingId,
    title:
      pickString(record, ["title", "name", "itemName", "item_name"]) ??
      fallbackTitle(listingId),
    startingPrice: pickNumber(record, ["startingPrice", "startPrice", "starting_price", "minimumPrice"]),
    currentPrice: pickNumber(record, ["currentPrice", "highestBid", "current_price", "price"]),
    minimumIncrement: pickNumber(record, ["minimumIncrement", "minIncrement", "minimum_increment"]),
    status: pickString(record, ["status", "state"]),
    endTime: pickString(record, ["endTime", "endedAt", "end_time"]),
  };
}

function normalizeBid(payload: unknown, fallback: Partial<Bid> = {}): Bid | null {
  const record = extractObject(payload);
  if (!record) {
    return null;
  }

  const listingId = pickString(record, ["listingId", "listing_id"]) ?? fallback.listingId;
  const buyerId = pickString(record, ["buyerId", "buyer_id"]) ?? fallback.buyerId;
  const bidAmount = pickNumber(record, ["bidAmount", "amount", "price", "bid_amount"]) ?? fallback.bidAmount;

  if (!listingId || !buyerId || bidAmount === undefined || bidAmount === null) {
    return null;
  }

  return {
    bidId: pickString(record, ["bidId", "id", "bid_id"]),
    listingId,
    buyerId,
    bidAmount,
    createdAt: pickString(record, ["createdAt", "timestamp", "created_at"]),
  };
}

function normalizeWallet(payload: unknown, fallbackBuyerId?: string): Wallet | null {
  const record = extractObject(payload);
  if (!record) {
    return null;
  }

  const buyerId = pickString(record, ["buyerId", "id", "buyer_id"]) ?? fallbackBuyerId;
  const balance = pickNumber(record, ["balance", "wallet", "amount"]);

  if (!buyerId || balance === null) {
    return null;
  }

  return {
    buyerId,
    balance,
    updatedAt: pickString(record, ["updatedAt", "updated_at", "lastUpdated"]),
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const candidates = ["message", "error", "detail", "title"];
  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BID_API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const message = extractErrorMessage(responseBody) ?? `Request gagal dengan status ${response.status}.`;
    throw new HttpError(message, response.status, responseBody);
  }

  return responseBody;
}

function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function getErrorMessage(error: unknown): string {
  if (isHttpError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui.";
}

export async function fetchMockListings(): Promise<Listing[]> {
  const response = await request("/api/bids/mocks/listings", {
    method: "GET",
  });

  return extractArray(response)
    .map((item) => normalizeListing(item))
    .filter((item): item is Listing => item !== null);
}

export async function createMockListing(): Promise<Listing | null> {
  const response = await request("/api/bids/mocks/listings", {
    method: "POST",
  });

  return normalizeListing(response);
}

export async function fetchListingBids(listingId: string): Promise<Bid[]> {
  const response = await request(`/api/bids/listing/${listingId}`, {
    method: "GET",
  });

  return extractArray(response)
    .map((item) => normalizeBid(item, { listingId }))
    .filter((item): item is Bid => item !== null);
}

export async function fetchHighestBid(listingId: string): Promise<Bid | null> {
  try {
    const response = await request(`/api/bids/listing/${listingId}/highest`, {
      method: "GET",
    });

    return normalizeBid(response, { listingId });
  } catch (error) {
    if (isHttpError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function fetchBuyerBids(buyerId: string): Promise<Bid[]> {
  const response = await request(`/api/bids/buyer/${buyerId}`, {
    method: "GET",
  });

  return extractArray(response)
    .map((item) => normalizeBid(item, { buyerId }))
    .filter((item): item is Bid => item !== null);
}

export async function submitBid(payload: CreateBidPayload): Promise<Bid | null> {
  const response = await request("/api/bids", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return (
    normalizeBid(response, payload) ?? {
      bidId: null,
      listingId: payload.listingId,
      buyerId: payload.buyerId,
      bidAmount: payload.bidAmount,
      createdAt: null,
    }
  );
}

export async function fetchWallet(buyerId: string): Promise<Wallet | null> {
  try {
    const response = await request(`/api/bids/mocks/wallets/${buyerId}`, {
      method: "GET",
    });

    return normalizeWallet(response, buyerId);
  } catch (error) {
    if (isHttpError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function updateWallet(payload: UpdateWalletPayload): Promise<Wallet | null> {
  const requestBodyCandidates = [
    { balance: payload.balance },
    { amount: payload.balance },
    { walletBalance: payload.balance },
  ];

  let lastError: unknown = null;

  for (const body of requestBodyCandidates) {
    try {
      const response = await request(`/api/bids/mocks/wallets/${payload.buyerId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      return normalizeWallet(response, payload.buyerId);
    } catch (error) {
      lastError = error;
      if (!isHttpError(error) || error.status < 400 || error.status >= 500) {
        throw error;
      }
    }
  }

  throw lastError;
}
