import client from "./client";
import type { Category, CreateCategoryRequest } from "@/types/api";

type BackendCategory = {
  id?: string;
  name?: string;
  parentId?: string | null;
};

function normalizeCategory(raw: BackendCategory): Category {
  const id = raw.id ?? "";

  return {
    id,
    name: raw.name ?? "",
    slug: id,
    description: null,
    imageUrl: null,
  };
}

function toBackendPayload(data: CreateCategoryRequest) {
  return {
    name: data.name,
  };
}

export async function getAll(): Promise<Category[]> {
  const { data } = await client.get<BackendCategory[]>("/api/categories");
  return (data ?? []).map(normalizeCategory);
}

export async function getRoots(): Promise<Category[]> {
  const { data } = await client.get<BackendCategory[]>("/api/categories/roots");
  return (data ?? []).map(normalizeCategory);
}

export async function getChildren(parentId: string): Promise<Category[]> {
  const { data } = await client.get<BackendCategory[]>(
    `/api/categories/${parentId}/children`
  );
  return (data ?? []).map(normalizeCategory);
}

export async function create(data: CreateCategoryRequest): Promise<Category> {
  const { data: res } = await client.post<BackendCategory>(
    "/api/categories",
    toBackendPayload(data)
  );
  return normalizeCategory(res);
}
