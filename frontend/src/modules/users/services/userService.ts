/**
 * User API. All user-related requests go through this service.
 */

import { api, buildListParams, type ApiPaginated, type ApiSuccess } from "@/services/api";
import type { User, UserCreateInput, UserUpdateInput, UserListParams } from "../types/userTypes";

export async function getUsers(params: UserListParams = {}): Promise<{ data: User[]; meta: { total: number; page: number; limit: number; pages: number } }> {
  const query = buildListParams({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    search: params.search,
    status: params.status,
  });
  const { data } = await api.get<ApiPaginated<User>>(`/users${query}`);
  return { data: data.data, meta: data.meta };
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>(`/users/${id}`);
  return data.data;
}

export async function createUser(payload: UserCreateInput): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>("/users", payload);
  return data.data;
}

export async function updateUser(id: string, payload: UserUpdateInput): Promise<User> {
  const { data } = await api.patch<ApiSuccess<User>>(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function sendPasswordReset(id: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string }>>(`/users/${id}/send-password-reset`, {});
  return data.data;
}
