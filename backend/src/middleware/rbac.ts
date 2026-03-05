import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { PERMISSIONS } from "../constants/permissions.js";
import type { Permission } from "../constants/permissions.js";
import type { AuthRequest } from "./auth.js";
import { getPermissionKeysForRole } from "../services/RolePermissionCache.js";
import { roleRepository } from "../lib/data-access.js";

const SUPER_ADMIN_ROLE_NAME = "SUPER_ADMIN";
const ADMIN_ALL_KEY = PERMISSIONS.ADMIN_ALL;

/** Resolve roleId from JWT; if missing, resolve from role name + agencyId for tenant users. */
async function resolveRoleId(req: AuthRequest): Promise<string | null> {
  const roleId = req.user?.roleId ?? null;
  if (roleId) return roleId;
  const agencyId = req.user?.agencyId;
  const role = req.user?.role;
  if (agencyId && role) {
    const resolved = await roleRepository.findRoleByNameAndAgency(agencyId, role);
    return resolved?.id ?? null;
  }
  return null;
}

/**
 * Require one of the given permissions.
 * SUPER_ADMIN: always allowed (no DB lookup).
 * Others: load permissions from cache/DB by roleId and check.
 * If roleId is missing in JWT (e.g. legacy token), resolves it from role name + agencyId.
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: AuthRequest, _res: unknown, next: NextFunction): Promise<void> => {
    const role = req.user?.role;
    if (!role) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
    }
    if (role === SUPER_ADMIN_ROLE_NAME) {
      next();
      return;
    }
    const roleId = await resolveRoleId(req);
    if (!roleId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Insufficient permissions", 403);
    }
    const keys = await getPermissionKeysForRole(roleId);
    const allowed = permissions.some((p) => keys.has(ADMIN_ALL_KEY) || keys.has(p));
    if (!allowed) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Insufficient permissions", 403);
    }
    next();
  };
}

/**
 * Allow if user has no agency (onboarding), else require one of the given permissions.
 */
export function allowOnboardingOrPermission(...permissions: Permission[]) {
  return async (req: AuthRequest, _res: unknown, next: NextFunction): Promise<void> => {
    if (req.user?.agencyId == null) {
      next();
      return;
    }
    const role = req.user.role;
    if (!role) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
    }
    if (role === SUPER_ADMIN_ROLE_NAME) {
      next();
      return;
    }
    const roleId = await resolveRoleId(req);
    if (!roleId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Insufficient permissions", 403);
    }
    const keys = await getPermissionKeysForRole(roleId);
    const allowed = permissions.some((p) => keys.has(ADMIN_ALL_KEY) || keys.has(p));
    if (!allowed) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Insufficient permissions", 403);
    }
    next();
  };
}
