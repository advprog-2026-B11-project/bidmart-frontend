import client from "./client";
import type { Category, CreateCategoryRequest } from "@/types/api";

/** GET /api/categories */
export async function getAll(): Promise<Category[]> {
  const { data } = await client.get<Category[]>("/api/categories");
  return data;
}

/** POST /api/categories */
export async function create(data: CreateCategoryRequest): Promise<Category> {
  const { data: res } = await client.post<Category>("/api/categories", data);
  return res;
}
