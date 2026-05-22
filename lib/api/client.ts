import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  clearUser,
} from "./storage";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://bidmart-backend-wn6p.onrender.com";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  refreshQueue = [];
}

// Attach Authorization header on every request
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

function redirectToHome(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

// Handle 401: silent token refresh, then retry. On double failure → logout.
// Handle 403: redirect to home page immediately.
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig;

    if (error.response?.status === 403) {
      redirectToHome();
      return Promise.reject(normalizeError(error));
    }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) =>
        refreshQueue.push({ resolve, reject })
      )
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        })
        .catch((err) => Promise.reject(normalizeError(err)));
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      clearUser();
      redirectToLogin();
      isRefreshing = false;
      return Promise.reject(normalizeError(error));
    }

    try {
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${BASE_URL}/api/auth/refresh`, { refreshToken });
      setTokens(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return client(original);
    } catch (refreshError) {
      processQueue(refreshError);
      clearTokens();
      clearUser();
      redirectToLogin();
      return Promise.reject(normalizeError(refreshError as AxiosError));
    } finally {
      isRefreshing = false;
    }
  }
);

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(0, "Tidak dapat terhubung ke server");
    }
    const data = error.response.data as Record<string, unknown>;
    const message =
      typeof data?.message === "string" ? data.message : "Terjadi kesalahan";
    const code =
      typeof data?.code === "string" ? data.code : undefined;
    return new ApiError(error.response.status, message, code);
  }

  return new ApiError(0, "Terjadi kesalahan tidak terduga");
}

export default client;
