export const ROUTES = {
  HOME: "/",
  CATALOG: "/catalog",
  LISTING_DETAIL: (id: string) => `/catalog/${id}`,
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    MFA: "/auth/verify-mfa",
  },
  WALLET: "/wallet",
  MY_BIDS: "/my-bids",
  MY_LISTINGS: "/seller/listings",
  CREATE_LISTING: "/seller/listings/new",
  ORDERS: "/orders",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;
