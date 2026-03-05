import type { NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import type { AuthRequest } from "./auth.js";

/**
 * Hard tenant boundary: requires agency context and sets tenant identity for the request.
 * Use on all tenant-scoped routes. RBAC is separate from tenant isolation; this enforces
 * that only requests with a tenant (agency) can access tenant resources. Resource-level
 * checks (req.user.agencyId === resource.agencyId) are enforced via query-level scoping
 * in repositories (e.g. findRoleByIdAndAgency, tenantScopeStrict).
 */
export function requireTenant(req: AuthRequest, _res: unknown, next: NextFunction): void {
  if (!req.user?.agencyId) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Agency context required", 403);
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
