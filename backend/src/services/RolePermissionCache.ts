/**
 * In-memory cache: roleId -> set of permission keys.
 * Used by requirePermission to avoid DB hit per request.
 * Load from DB on cache miss; no invalidation (restart or refresh() to pick up changes).
 */

import { prisma } from "../lib/prisma.js";

const cache = new Map<string, Set<string>>();

export function getCachedPermissionKeys(roleId: string): Set<string> | null {
  return cache.get(roleId) ?? null;
}

export function setCachedPermissionKeys(roleId: string, keys: Set<string>): void {
  cache.set(roleId, keys);
}

export function invalidateRole(roleId: string): void {
  cache.delete(roleId);
}

export async function loadPermissionKeysForRole(roleId: string): Promise<Set<string>> {
  const rows = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { key: true } } },
  });
  const keys = new Set(rows.map((r) => r.permission.key));
  setCachedPermissionKeys(roleId, keys);
  return keys;
}

/**
 * Get permission keys for a role (from cache or DB).
 */
export async function getPermissionKeysForRole(roleId: string): Promise<Set<string>> {
  const cached = getCachedPermissionKeys(roleId);
  if (cached) return cached;
  return loadPermissionKeysForRole(roleId);
}

/**
 * Preload all system and agency role permissions into cache (e.g. on startup).
 */
export async function refresh(): Promise<void> {
  cache.clear();
  const rolePerms = await prisma.rolePermission.findMany({
    select: { roleId: true, permission: { select: { key: true } } },
  });
  const byRole = new Map<string, Set<string>>();
  for (const rp of rolePerms) {
    let set = byRole.get(rp.roleId);
    if (!set) {
      set = new Set();
      byRole.set(rp.roleId, set);
    }
    set.add(rp.permission.key);
  }
  byRole.forEach((set, roleId) => cache.set(roleId, set));
}
