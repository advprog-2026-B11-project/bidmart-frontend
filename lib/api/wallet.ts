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
function normalizeTransaction(tx: any): Transaction {
  if (!tx) return tx;
  let dateStr = tx.createdAt;
  if (Array.isArray(dateStr)) {
    const [y, m, d, h = 0, min = 0, s = 0, ns = 0] = dateStr;
    const pad = (n: number) => String(n).padStart(2, "0");
    const ms = Math.floor(ns / 1_000_000);
    dateStr = `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}.${String(ms).padStart(3, "0")}`;
  }
  return { ...tx, createdAt: dateStr };
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

  const { data: res } = await client.post<any>(
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

  const { data: res } = await client.post<any>(
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
  const { data } = await client.get<any>(
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
  return {
    ...data,
    content: (data.content || []).map(normalizeTransaction),
  };
}

/** GET /api/wallet/transactions/:id */
export async function getTransactionById(id: string): Promise<Transaction> {
  const { data } = await client.get<any>(
    `/api/wallet/transactions/${id}`
  );
  return normalizeTransaction(data);
}
