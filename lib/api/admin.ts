import client from "./client";
import type {
  AdminUser,
  AdminRole,
  Permission,
  PaginatedResponse,
  CreateRoleRequest,
  UpdateRolePermissionsRequest,
  ChangeUserRoleRequest,
} from "@/types/api";

export interface ListUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: string;
}

type RawPage<T> = {
  content?: T[];
  number?: number;
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
};

function normalizePage<T>(raw: RawPage<T> | T[]): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    return {
      content: raw,
      page: 0,
      size: raw.length,
      totalElements: raw.length,
      totalPages: 1,
      last: true,
    };
  }
  return {
    content: raw.content ?? [],
    page: raw.number ?? raw.page ?? 0,
    size: raw.size ?? 20,
    totalElements: raw.totalElements ?? 0,
    totalPages: raw.totalPages ?? 1,
    last: raw.last ?? true,
  };
}

/** GET /api/admin/users */
export async function listUsers(
  params: ListUsersParams = {}
): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await client.get<RawPage<AdminUser> | AdminUser[]>(
    "/api/admin/users",
    { params: { page: 0, size: 20, ...params } }
  );
  return normalizePage(data);
}

/** POST /api/admin/users/:id/deactivate */
export async function deactivateUser(userId: string): Promise<void> {
  await client.post(`/api/admin/users/${userId}/deactivate`);
}

/** PUT /api/admin/users/:id/role */
export async function changeUserRole(
  userId: string,
  role: string
): Promise<AdminUser> {
  const body: ChangeUserRoleRequest = { role };
  const { data } = await client.put<AdminUser>(
    `/api/admin/users/${userId}/role`,
    body
  );
  return data;
}

/** GET /api/admin/permissions */
export async function listPermissions(): Promise<Permission[]> {
  const { data } = await client.get<Permission[]>("/api/admin/permissions");
  return Array.isArray(data) ? data : [];
}

/** GET /api/admin/roles */
export async function listRoles(): Promise<AdminRole[]> {
  const { data } = await client.get<AdminRole[]>("/api/admin/roles");
  return Array.isArray(data) ? data : [];
}

/** POST /api/admin/roles */
export async function createRole(payload: CreateRoleRequest): Promise<AdminRole> {
  const { data } = await client.post<AdminRole>("/api/admin/roles", payload);
  return data;
}

/** PUT /api/admin/roles/:id/permissions */
export async function updateRolePermissions(
  roleId: string,
  payload: UpdateRolePermissionsRequest
): Promise<AdminRole> {
  const { data } = await client.put<AdminRole>(
    `/api/admin/roles/${roleId}/permissions`,
    payload
  );
  return data;
}

/** DELETE /api/admin/roles/:id */
export async function deleteRole(roleId: string): Promise<void> {
  await client.delete(`/api/admin/roles/${roleId}`);
}
