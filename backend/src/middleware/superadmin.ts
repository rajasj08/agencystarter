import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { ROLES } from "../constants/roles.js";
import type { AuthRequest } from "./auth.js";

/**
 * Require the authenticated user to have role SUPER_ADMIN.
 * Use on routes that are super-admin only (e.g. /api/v1/superadmin/*).
 */
export function requireSuperAdmin(req: AuthRequest, _res: unknown, next: NextFunction): void {
  if (req.user?.role !== ROLES.SUPER_ADMIN) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin access required", 403);
  }
  next();
}
