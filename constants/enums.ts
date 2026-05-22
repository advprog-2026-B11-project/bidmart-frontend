export const AuctionStatus = {
  DRAFT:     "DRAFT",
  ACTIVE:    "ACTIVE",
  EXTENDED:  "EXTENDED",
  ENDED:     "ENDED",
  CLOSED:    "CLOSED",
  CANCELLED: "CANCELLED",
  SOLD:      "SOLD",
  WON:       "WON",
} as const;
export type AuctionStatus = (typeof AuctionStatus)[keyof typeof AuctionStatus];

export const OrderStatus = {
  PENDING:    "PENDING",
  PAID:       "PAID",
  SHIPPED:    "SHIPPED",
  DELIVERED:  "DELIVERED",
  COMPLETED:  "COMPLETED",
  CANCELLED:  "CANCELLED",
  REFUNDED:   "REFUNDED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const TransactionType = {
  TOP_UP:       "TOPUP",
  BID_HOLD:     "HOLD",
  BID_REFUND:   "REFUND",
  PAYMENT:      "PAYMENT",
  PAYOUT:       "INCOME",
  WITHDRAWAL:   "WITHDRAWAL",
  COMMISSION:   "COMMISSION",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const NotificationType = {
  BID_PLACED:      "BID_PLACED",
  BID_OUTBID:      "BID_OUTBID",
  AUCTION_WON:     "AUCTION_WON",
  AUCTION_ENDED:   "AUCTION_ENDED",
  ORDER_UPDATE:    "ORDER_UPDATE",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  SYSTEM:          "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const PaymentMethod = {
  WALLET:      "WALLET",
  BANK_TRANSFER: "BANK_TRANSFER",
  VIRTUAL_ACCOUNT: "VIRTUAL_ACCOUNT",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const UserRole = {
  BUYER:  "BUYER",
  SELLER: "SELLER",
  ADMIN:  "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
