"use client";

import { useMemo } from "react";
import { useAuthStore, isSuperAdminUser } from "@/store/auth";
import { hasPermission } from "@/core/auth/authorization";
import type { Permission } from "@/constants/permissions";

/**
 * Returns a stable `can(permission)` function. Uses central auth store permissions.
 * Prefer useAuthorization() for new code. This hook is kept for backward compatibility.
 * Example: {can(PERMISSIONS.USER_CREATE) && <AppButton>Add User</AppButton>}
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  return useMemo(() => {
    const isSuperAdmin = isSuperAdminUser(user);
    const permSet = new Set(permissions);

    const can = (permission: Permission | string): boolean =>
      hasPermission(permSet, permission, isSuperAdmin);

    return {
      can,
      role: user?.role ?? null,
      permissions,
      isAuthenticated: !!user,
    };
  }, [user, permissions]);
}
