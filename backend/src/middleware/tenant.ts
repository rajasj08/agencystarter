import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import type { AuthRequest } from "./auth.js";

/**
 * Requires request to have an agency (tenant) context.
 * Use on routes that are tenant-scoped.
 */
export function requireTenant(req: AuthRequest, _res: unknown, next: NextFunction): void {
  if (!req.user?.agencyId) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Agency context required", 403);
  }
  next();
}
