import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { PERMISSIONS } from "../constants/permissions.js";
import type { Permission } from "../constants/permissions.js";
import type { AuthRequest } from "./auth.js";
import { getPermissionKeysForRole } from "../services/RolePermissionCache.js";

const SUPER_ADMIN_ROLE_NAME = "SUPER_ADMIN";
const ADMIN_ALL_KEY = PERMISSIONS.ADMIN_ALL;

/**
 * Require one of the given permissions.
 * SUPER_ADMIN: always allowed (no DB lookup).
 * Others: load permissions from cache/DB by roleId and check.
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: AuthRequest, _res: unknown, next: NextFunction): Promise<void> => {
    const role = req.user?.role;
    const roleId = req.user?.roleId;
    if (!role) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
    }
    if (role === SUPER_ADMIN_ROLE_NAME) {
      next();
      return;
    }
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
    const roleId = req.user.roleId;
    if (!role) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
    }
    if (role === SUPER_ADMIN_ROLE_NAME) {
      next();
      return;
    }
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
