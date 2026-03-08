import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { agencyRepository } from "../lib/data-access.js";
import type { AuthRequest } from "./auth.js";

/**
 * Hard tenant boundary: requires agency context and sets tenant identity for the request.
 * Also ensures the agency is ACTIVE (blocks disabled/suspended/deleted agencies).
 * Use on all tenant-scoped routes. RBAC is separate from tenant isolation.
 */
export async function requireTenant(req: AuthRequest, _res: unknown, next: NextFunction): Promise<void> {
  if (!req.user?.agencyId) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Agency context required", 403);
  }
  const agency = await agencyRepository.findById(req.user.agencyId);
  if (!agency || agency.status !== "ACTIVE") {
    throw new AppError(ERROR_CODES.AGENCY_NOT_ACTIVE, "Your organization is not available", 403);
  }
  (req as AuthRequest & { tenantAgencyId?: string }).tenantAgencyId = req.user.agencyId;
  next();
}

/**
 * Alias for requireTenant. Use when you want to make it explicit that the route
 * requires tenant context (req.user.agencyId exists, route is tenant-scoped, no platform
 * route accidentally leaking into tenant).
 */
export const requireTenantContext = requireTenant;
