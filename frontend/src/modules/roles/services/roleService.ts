/**
 * Role API. Uses backend GET/POST/PATCH/DELETE /roles and GET /roles/permissions.
 */

import { api, type ApiSuccess } from "@/services/api";
import type { Role, RoleDetail, Permission } from "../types/roleTypes";

export async function getPermissions(): Promise<Permission[]> {
  const res = await api.get<ApiSuccess<Permission[]>>("/roles/permissions");
  return res.data.data;
}

/** Current user's permission IDs (for restricting assignable permissions in UI). */
export async function getMyPermissionIds(): Promise<string[]> {
  const res = await api.get<ApiSuccess<string[]>>("/roles/my-permission-ids");
  return res.data.data;
}

export async function getRoles(): Promise<Role[]> {
  const res = await api.get<ApiSuccess<Role[]>>("/roles");
  return res.data.data;
}

export async function getRoleById(id: string): Promise<RoleDetail | null> {
  try {
    const res = await api.get<ApiSuccess<RoleDetail>>(`/roles/${id}`);
    return res.data.data;
  } catch {
    return null;
  }
}

export async function createRole(payload: { name: string; permissionIds: string[] }): Promise<{ id: string; name: string }> {
  const res = await api.post<ApiSuccess<RoleDetail>>("/roles", payload);
  return { id: res.data.data.id, name: res.data.data.name };
}

export async function updateRole(
  id: string,
  payload: { name?: string; permissionIds?: string[] }
): Promise<{ id: string }> {
  await api.patch<ApiSuccess<RoleDetail>>(`/roles/${id}`, payload);
  return { id };
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}
