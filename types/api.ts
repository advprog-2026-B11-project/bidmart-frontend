import type { AuctionStatus, OrderStatus, TransactionType, NotificationType, PaymentMethod, UserRole } from "@/constants/enums";

/* ─── Auth ───────────────────────────────────────────────────────────────── */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface MfaVerifyRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

/* ─── User ───────────────────────────────────────────────────────────────── */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  user: UserProfile;
  accessToken: string;
  expiresAt: string;
}

/* ─── Wallet ─────────────────────────────────────────────────────────────── */

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  holdBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  description: string;
  createdAt: string;
}

export interface TopUpRequest {
  amount: number;
  paymentMethod: PaymentMethod;
}

/* ─── Category ───────────────────────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

/* ─── Listing ────────────────────────────────────────────────────────────── */

export interface Listing {
  id: string;
  title: string;
  description: string;
  imageUrls: string[];
  startingPrice: number;
  currentPrice: number;
  reservePrice: number | null;
  buyNowPrice: number | null;
  status: AuctionStatus;
  category: Category;
  seller: UserProfile;
  totalBids: number;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  imageUrls: string[];
  startingPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  categoryId: string;
  startAt: string;
  endAt: string;
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  status?: AuctionStatus;
}

/* ─── Bid ────────────────────────────────────────────────────────────────── */

export interface Bid {
  id: string;
  listingId: string;
  bidder: UserProfile;
  amount: number;
  isWinning: boolean;
  createdAt: string;
}

export interface PlaceBidRequest {
  listingId: string;
  amount: number;
}

/* ─── Order ──────────────────────────────────────────────────────────────── */

export interface Order {
  id: string;
  listing: Listing;
  buyer: UserProfile;
  seller: UserProfile;
  finalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  shippingAddress: ShippingAddress | null;
  trackingNumber: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PayOrderRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  shippingAddress?: ShippingAddress;
}

/* ─── Notification ───────────────────────────────────────────────────────── */

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

/* ─── Pagination ─────────────────────────────────────────────────────────── */

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
