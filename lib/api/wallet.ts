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

/** POST /api/wallet/topup */
export async function topUp(
  data: TopUpRequest,
  idempotencyKey?: string
): Promise<Transaction> {
  const payload = {
    amount: data.amount,
    method: data.paymentMethod === "BANK_TRANSFER" ? "BANK" : data.paymentMethod,
    paymentDetails: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
    },
    idempotencyKey: idempotencyKey,
  };

  const { data: res } = await client.post<Transaction>(
    "/api/wallet/topup",
    payload,
    idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
  );
  return res;
}

/** POST /api/wallet/withdraw */
export async function withdraw(data: WithdrawRequest): Promise<Transaction> {
  const payload = {
    amount: data.amount,
    method: "BANK",
    paymentDetails: {
      bankName: data.bankName,
      accountNumber: data.bankAccount,
    },
  };

  const { data: res } = await client.post<Transaction>(
    "/api/wallet/withdraw",
    payload
  );
  return res;
}

/** GET /api/wallet/transactions */
export async function getTransactions(
  page = 0,
  size = 20
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await client.get<PaginatedResponse<Transaction> | Transaction[]>(
    "/api/wallet/transactions",
    { params: { page, size } }
  );
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
      last: true,
    };
  }
  return data;
}

/** GET /api/wallet/transactions/:id */
export async function getTransactionById(id: string): Promise<Transaction> {
  const { data } = await client.get<Transaction>(
    `/api/wallet/transactions/${id}`
  );
  return data;
}
