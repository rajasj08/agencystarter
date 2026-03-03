"use client";

import { useCallback, useState } from "react";
import * as userService from "../services/userService";
import type { UserListParams } from "../types/userTypes";
import type { User, UserCreateInput, UserUpdateInput } from "../types/userTypes";

const DEFAULT_LIMIT = 10;

export function useUsers(initialParams: UserListParams = {}) {
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: DEFAULT_LIMIT, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (params: UserListParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers({
        page: params.page ?? initialParams.page ?? 1,
        limit: params.limit ?? initialParams.limit ?? DEFAULT_LIMIT,
        sortBy: params.sortBy ?? initialParams.sortBy,
        sortOrder: params.sortOrder ?? initialParams.sortOrder,
        search: params.search ?? initialParams.search,
        status: params.status ?? initialParams.status,
      });
      setData(result.data);
      setMeta(result.meta);
      return result;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load users";
      setError(message);
      setData([]);
      return { data: [], meta: { total: 0, page: 1, limit: DEFAULT_LIMIT, pages: 1 } };
    } finally {
      setLoading(false);
    }
  }, [initialParams.page, initialParams.limit, initialParams.sortBy, initialParams.sortOrder, initialParams.search, initialParams.status]);

  return { data, meta, loading, error, fetchUsers };
}

export function useUser(id: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUserById(userId);
      setUser(data);
      return data;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load user";
      setError(message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, fetchUser };
}

export function useUserMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (payload: UserCreateInput): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      return await userService.createUser(payload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create user");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id: string, payload: UserUpdateInput): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      return await userService.updateUser(id, payload);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update user");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await userService.deleteUser(id);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createUser, updateUser, deleteUser, loading, error };
}
