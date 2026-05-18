export type UUID = string;

export interface Listing {
  listingId: UUID;
  title: string;
  startingPrice: number | null;
  currentPrice: number | null;
  minimumIncrement: number | null;
  status: string | null;
  endTime: string | null;
}

export interface Bid {
  bidId: UUID | null;
  listingId: UUID;
  buyerId: UUID;
  bidAmount: number;
  createdAt: string | null;
}

export interface Wallet {
  buyerId: UUID;
  balance: number;
  updatedAt: string | null;
}

export interface CreateBidPayload {
  listingId: UUID;
  buyerId: UUID;
  bidAmount: number;
}

export interface UpdateWalletPayload {
  buyerId: UUID;
  balance: number;
}

export interface ApiStatus {
  kind: "success" | "error" | "info";
  message: string;
}
