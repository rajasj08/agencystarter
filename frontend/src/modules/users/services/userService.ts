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
  const list = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: 10, pages: 1 };
  return { data: list, meta };
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

export async function restoreUser(id: string): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>(`/users/${id}/restore`, {});
  return data.data;
}

export async function sendPasswordReset(id: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string }>>(`/users/${id}/send-password-reset`, {});
  return data.data;
}

export async function activateUser(id: string): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>(`/users/${id}/activate`, {});
  return data.data;
}

export async function suspendUser(id: string): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>(`/users/${id}/suspend`, {});
  return data.data;
}

export async function disableUser(id: string): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>(`/users/${id}/disable`, {});
  return data.data;
}

export async function resendInvite(id: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string }>>(`/users/${id}/resend-invite`, {});
  return data.data;
}

export async function setPassword(id: string, password: string): Promise<User> {
  const { data } = await api.post<ApiSuccess<User>>(`/users/${id}/set-password`, { password });
  return data.data;
}
