import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import type { AuthRequest } from "./auth.js";

export type RouteScope = "PLATFORM" | "TENANT";

/**
 * Require route scope. PLATFORM = superadmin only (isSuperAdmin); TENANT = any authenticated user with agency.
 * Use after authMiddleware. Non–superadmin users are blocked from PLATFORM routes.
 */
export function requireRouteScope(scope: RouteScope) {
  return (req: AuthRequest, _res: unknown, next: NextFunction): void => {
    const tokenScope = req.user?.scope;
    if (scope === "PLATFORM") {
      if (tokenScope !== "platform") {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Platform scope required", 403);
      }
    }
    if (scope === "TENANT") {
      if (tokenScope !== "tenant") {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Tenant scope required", 403);
      }
      if (req.user?.agencyId == null) {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Agency context required", 403);
      }
    }
    next();
  };
}
