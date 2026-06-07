import client from "./client";
import type {
  Wallet,
  Transaction,
  TopUpRequest,
  WithdrawRequest,
  PaginatedResponse,
} from "@/types/api";

/** GET /api/wallet/balance */
export async function getBalance(): Promise<Wallet> {
  const { data } = await client.get<Wallet>("/api/wallet/balance");
  return data;
}

/** Helper to parse Java LocalDateTime Array to ISO String */
function normalizeTransaction(tx: unknown): Transaction {
  if (!tx) return tx as Transaction;
  const t = tx as Record<string, unknown>;
  let dateStr = t.createdAt;
  if (Array.isArray(dateStr)) {
    const [y, m, d, h = 0, min = 0, s = 0, ns = 0] = dateStr as number[];
    const pad = (n: number) => String(n).padStart(2, "0");
    const ms = Math.floor(ns / 1_000_000);
    dateStr = `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}.${String(ms).padStart(3, "0")}`;
  }
  return { ...t, createdAt: dateStr } as Transaction;
}

/** POST /api/wallet/topup */
export async function topUp(
  data: TopUpRequest,
  idempotencyKey?: string
): Promise<Transaction> {
  const key = idempotencyKey ?? crypto.randomUUID();

  const paymentDetails: Record<string, string> =
    data.paymentMethod === "BANK_TRANSFER" || data.paymentMethod === "VIRTUAL_ACCOUNT"
      ? {
        bankName: data.bankName ?? "",
        accountNumber: data.accountNumber ?? "",
      }
      : data.paymentMethod === "GOPAY"
        ? { phoneNumber: data.phoneNumber ?? "" }
        : {};

  const method =
    data.paymentMethod === "BANK_TRANSFER" ? "BANK" : data.paymentMethod;

  const payload = {
    amount: data.amount,
    method,
    paymentDetails,
    idempotencyKey: key,
  };

  const { data: res } = await client.post<unknown>(
    "/api/wallet/top-up",
    payload,
    { headers: { "Idempotency-Key": key } }
  );
  return normalizeTransaction(res);
}

/** POST /api/wallet/withdraw */
export async function withdraw(
  data: WithdrawRequest,
  idempotencyKey?: string
): Promise<Transaction> {
  const key = idempotencyKey ?? crypto.randomUUID();

  const method =
    data.paymentMethod === "BANK_TRANSFER" ? "BANK" : (data.paymentMethod ?? "BANK");

  const paymentDetails: Record<string, string> =
    method === "BANK"
      ? {
        bankName: data.bankName ?? "",
        accountNumber: data.bankAccount ?? "",
      }
      : method === "GOPAY"
        ? { phoneNumber: data.phoneNumber ?? "" }
        : {};

  const payload = {
    amount: data.amount,
    method,
    paymentDetails,
    idempotencyKey: key,
  };

  const { data: res } = await client.post<unknown>(
    "/api/wallet/withdraw",
    payload,
    { headers: { "Idempotency-Key": key } }
  );
  return normalizeTransaction(res);
}

/** GET /api/wallet/transactions */
export async function getTransactions(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await client.get<unknown>(
    "/api/wallet/transactions",
    { params: { page, size } }
  );
  if (Array.isArray(data)) {
    return {
      content: data.map(normalizeTransaction),
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
      last: true,
    };
  }
  const paginated = data as PaginatedResponse<unknown>;
  return {
    ...paginated,
    content: (paginated.content || []).map(normalizeTransaction) as Transaction[],
  } as PaginatedResponse<Transaction>;
}

/** GET /api/wallet/transactions/:id */
export async function getTransactionById(id: string): Promise<Transaction> {
  const { data } = await client.get<unknown>(
    `/api/wallet/transactions/${id}`
  );
  return normalizeTransaction(data);
}
