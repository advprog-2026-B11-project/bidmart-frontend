import client from "./client";
import type {
  Wallet,
  Transaction,
  TopUpRequest,
  WithdrawRequest,
  PaginatedResponse,
} from "@/types/api";

/** GET /api/wallet */
export async function getBalance(): Promise<Wallet> {
  const { data } = await client.get<Wallet>("/api/wallet");
  return data;
}

/** POST /api/wallet/topup */
export async function topUp(
  data: TopUpRequest,
  idempotencyKey?: string
): Promise<Transaction> {
  const { data: res } = await client.post<Transaction>(
    "/api/wallet/topup",
    data,
    idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
  );
  return res;
}

/** POST /api/wallet/withdraw */
export async function withdraw(data: WithdrawRequest): Promise<Transaction> {
  const { data: res } = await client.post<Transaction>(
    "/api/wallet/withdraw",
    data
  );
  return res;
}

/** GET /api/wallet/transactions */
export async function getTransactions(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await client.get<PaginatedResponse<Transaction>>(
    "/api/wallet/transactions",
    { params: { page, size } }
  );
  return data;
}

/** GET /api/wallet/transactions/:id */
export async function getTransactionById(id: string): Promise<Transaction> {
  const { data } = await client.get<Transaction>(
    `/api/wallet/transactions/${id}`
  );
  return data;
}
