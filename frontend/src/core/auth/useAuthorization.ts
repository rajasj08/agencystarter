"use client";

import { useMemo } from "react";
import { useAuthStore, isSuperAdminUser } from "@/store/auth";
import { hasPermission as hasPermissionFn, hasAnyPermission as hasAnyPermissionFn } from "@/core/auth/authorization";

/**
 * Authorization hook for UI: permission-based checks only (no role names).
 * Returns stable hasPermission / hasAnyPermission; O(1) via Set inside auth module.
 */
export function useAuthorization() {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  return useMemo(() => {
    const isSuperAdmin = isSuperAdminUser(user);
    const permSet = new Set(permissions);

    const hasPermission = (required: string): boolean =>
      hasPermissionFn(permSet, required, isSuperAdmin);

    const hasAnyPermission = (required: string | string[]): boolean =>
      hasAnyPermissionFn(permSet, required, isSuperAdmin);

    return {
      hasPermission,
      hasAnyPermission,
      permissions,
      isAuthenticated: !!user,
      isSuperAdmin,
      user,
    };
  }, [user, permissions]);
}
