import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { get as getSystemConfig } from "../services/SystemConfigCache.js";

/**
 * When maintenance mode is on (env or system config), respond 503 for most requests.
 * Allow: /login, /platform/*, /superadmin (so super admin can turn off maintenance), /health, /system.
 */
export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config = getSystemConfig();
  const maintenanceOn = env.MAINTENANCE_MODE || config.maintenanceMode;
  if (!maintenanceOn) {
    next();
    return;
  }
  const path = req.path;
  const apiPrefix = env.API_PREFIX;
  if (path === "/health" || path === "/health/db" || path === "/health/mail" || path.startsWith("/system")) {
    next();
    return;
  }
  if (path.startsWith(apiPrefix)) {
    const rest = path.slice(apiPrefix.length);
    if (rest.startsWith("/auth/login") || rest.startsWith("/auth/refresh")) return next();
    if (rest.startsWith("/platform")) return next();
    if (rest.startsWith("/superadmin")) return next();
  }
  res.status(503).json({
    success: false,
    code: "MAINTENANCE",
    message: config.maintenanceMessage || "Service temporarily unavailable for maintenance",
  });
}
