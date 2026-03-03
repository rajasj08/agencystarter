"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission, type Role } from "@/constants/permissions";

const ADMIN_ALL = PERMISSIONS.ADMIN_ALL;

function getPermissionsForRole(role: string): Permission[] {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return [];
  return permissions;
}

/**
 * Returns a stable `can(permission)` function and loading state.
 * Use to hide/disable UI the user is not allowed to use (backend still enforces).
 * Example: {can("user:create") && <AppButton>Add User</AppButton>}
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    const role = user?.role ?? null;
    const permissions = role ? getPermissionsForRole(role) : [];

    function can(permission: Permission | string): boolean {
      if (!role) return false;
      if (permissions.includes(ADMIN_ALL)) return true;
      return permissions.includes(permission as Permission);
    }

    return {
      can,
      role,
      permissions,
      isAuthenticated: !!user,
    };
  }, [user?.role]);
}
