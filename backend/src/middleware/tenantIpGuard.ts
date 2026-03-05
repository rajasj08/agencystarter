import type { Response, NextFunction } from "express";
import { settingsRepository } from "../lib/data-access.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { isIpInAllowlist } from "../utils/cidr.js";
import type { AuthRequest } from "./auth.js";
import { audit } from "../lib/audit.js";

/**
 * Tenant IP allowlist guard. Run after auth and requireTenant.
 * - If user is superadmin (platform scope), skip check.
 * - If agency has no ipAllowlist or empty, allow.
 * - Otherwise require client IP to be in one of the allowed CIDR ranges.
 * Blocked requests are audited (ip_allowlist.blocked).
 *
 * Design: Does not apply to health or platform-only routes (no tenant context).
 * Login (POST /auth/login) is unauthenticated and has no agencyId, so it is not
 * subject to IP allowlist; only authenticated tenant routes are checked.
 */
export async function tenantIpGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const user = req.user;
  if (!user) {
    next();
    return;
  }
  if (user.isSuperAdmin === true && !user.agencyId) {
    next();
    return;
  }
  const agencyId = user.agencyId;
  if (!agencyId) {
    next();
    return;
  }

  let settings: Record<string, unknown>;
  try {
    const raw = await settingsRepository.getAgencySettings(agencyId);
    settings = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  } catch {
    next();
    return;
  }

  const allowlist = settings.ipAllowlist;
  if (!Array.isArray(allowlist) || allowlist.length === 0) {
    next();
    return;
  }

  const clientIp = req.ip ?? req.context?.ip ?? req.socket?.remoteAddress ?? "";
  if (!clientIp || typeof clientIp !== "string") {
    next();
    return;
  }

  const allowed = allowlist.filter((x): x is string => typeof x === "string");
  if (isIpInAllowlist(clientIp, allowed)) {
    next();
    return;
  }

  try {
    await audit(req, {
      action: "ip_allowlist.blocked",
      resource: "request",
      resourceId: undefined,
      details: { agencyId, clientIp },
    });
  } catch {
    // non-fatal
  }
  next(new AppError(ERROR_CODES.IP_NOT_ALLOWED, "Request from this IP is not allowed", 403));
}
