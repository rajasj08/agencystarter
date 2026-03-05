/**
 * Central permission resolver. Backend source of truth for user/role permissions.
 * Uses request-scoped cache to avoid duplicate DB hits in the same request.
 */

import { ROLES } from "../../constants/roles.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { getPermissionKeysForRole } from "../../services/RolePermissionCache.js";

const ADMIN_ALL = PERMISSIONS.ADMIN_ALL;
const SUPER_ADMIN_ROLE = ROLES.SUPER_ADMIN;

export type UserWithRole = {
  roleRef?: { id: string; name: string } | null;
  role?: string | null;
  roleId?: string | null;
};

/**
 * Request-scoped cache: roleId -> Set<permission key>.
 * Pass the same map within one request to dedupe lookups.
 */
export type RequestPermissionCache = Map<string, Set<string>>;

/**
 * Get permission keys for a role by ID (from DB/cache).
 * Uses optional requestCache to avoid duplicate loads in the same request.
 */
export async function getPermissionsForRole(
  roleId: string,
  requestCache?: RequestPermissionCache
): Promise<Set<string>> {
  if (requestCache?.has(roleId)) {
    return requestCache.get(roleId)!;
  }
  const keys = await getPermissionKeysForRole(roleId);
  requestCache?.set(roleId, keys);
  return keys;
}

/**
 * Get permission keys for a user. SUPER_ADMIN gets admin:all; others get role permissions from DB.
 */
export async function getPermissionsForUser(
  user: UserWithRole,
  requestCache?: RequestPermissionCache
): Promise<Set<string>> {
  const roleName = user.roleRef?.name ?? user.role ?? null;
  if (roleName === SUPER_ADMIN_ROLE) {
    return new Set([ADMIN_ALL]);
  }
  const roleId = user.roleRef?.id ?? user.roleId ?? null;
  if (!roleId) {
    return new Set();
  }
  return getPermissionsForRole(roleId, requestCache);
}
