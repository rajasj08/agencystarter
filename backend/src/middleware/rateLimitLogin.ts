import type { Request, Response, NextFunction } from "express";

/**
 * Placeholder for login brute-force protection.
 * Production: use express-rate-limit (or Redis-backed rate limiter) here.
 * - Key by IP and optionally by email (after first failure).
 * - Limit e.g. 5 failed attempts per 15 minutes per IP.
 * - Optionally lock account or require CAPTCHA after N failures.
 */
export function rateLimitLogin(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
