"use client";

import { useCallback, useState } from "react";
import * as roleService from "../services/roleService";
import type { Role } from "../types/roleTypes";

export function useRoles() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await roleService.getRoles();
      setData(list);
      return list;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load roles";
      setError(message);
      setData([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchRoles };
}

export function useRole(id: string | null) {
  const [role, setRole] = useState<import("../types/roleTypes").RoleDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async (roleId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await roleService.getRoleById(roleId);
      setRole(data ?? null);
      return data;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load role";
      setError(message);
      setRole(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { role, loading, error, fetchRole };
}
