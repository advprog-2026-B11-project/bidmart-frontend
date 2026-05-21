import type { AuctionStatus, OrderStatus, TransactionType, NotificationType, PaymentMethod, UserRole } from "@/constants/enums";

/* ─── Auth ───────────────────────────────────────────────────────────────── */

export interface LoginRequest {
  identifier: string;
  password: string;
}

export type RegisterRole = "USER" | "SELLER";

export interface RegisterRequest {
  username: string;
  email: string;
  displayName: string;
  password: string;
  role?: RegisterRole;
}

export interface MfaVerifyRequest {
  email: string;
  code: string;
}

export interface MfaStatusResponse {
  enabled: boolean;
  method: "NONE" | "TOTP" | "EMAIL";
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeImageUri: string;
  method: "TOTP";
  enabled: boolean;
}

export interface MfaEnableRequest {
  code: string;
}

export interface MfaEmailVerifyRequest {
  code: string;
}

export interface MfaDisableRequest {
  password?: string;
  totpCode?: string;
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
  phoneNumber?: string | null;
  shippingAddress?: string | null;
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
  bankName?: string;
  accountNumber?: string;
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
  currentHighestBidderId?: string;
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
  listing?: Listing;
}

export interface PlaceBidRequest {
  listingId: string;
  amount: number;
  proxyBid?: boolean;
  proxyMaxLimit?: number;
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

export interface ApiErrorResponse {
  status: number;
  error?: string;
  code?: string;
  message: string;
  timestamp: string;
  path?: string;
}

/* ─── Auth (extended) ────────────────────────────────────────────────────── */

export interface MfaRequiredResponse {
  mfaRequired: true;
  tempToken: string;
}

export type LoginResponse = AuthResponse | MfaRequiredResponse;

export interface LoginMfaRequest {
  tempToken: string;
  code: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  phoneNumber?: string;
  imageUrl?: string;
  shippingAddress?: string;
}

/* ─── Sessions ───────────────────────────────────────────────────────────── */

export interface DeviceSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
}

/* ─── Wallet (extended) ──────────────────────────────────────────────────── */

export interface WithdrawRequest {
  amount: number;
  bankAccount: string;
  bankName: string;
}

/* ─── Listing (extended) ─────────────────────────────────────────────────── */

export interface ListingSearchParams {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

/* ─── Bid (extended) ─────────────────────────────────────────────────────── */

export interface MinimumBidResponse {
  minimumBid: number;
}

/* ─── Category (extended) ────────────────────────────────────────────────── */

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

/* ─── Notification (extended) ────────────────────────────────────────────── */

export interface NotificationPreferences {
  bidPlaced: boolean;
  bidOutbid: boolean;
  auctionWon: boolean;
  auctionEnded: boolean;
  orderUpdate: boolean;
  paymentSuccess: boolean;
  system: boolean;
}

/* ─── Order (extended) ───────────────────────────────────────────────────── */

export interface UpdateTrackingRequest {
  trackingNumber: string;
  carrier?: string;
}

export interface DisputeRequest {
  reason: string;
  description: string;
}

export interface ResolveDisputeRequest {
  resolution: string;
  description?: string;
}
