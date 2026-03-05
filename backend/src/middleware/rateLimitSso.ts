import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * SSO rate limit: per IP and per agency (initiate) or per IP (callback).
 * Protects token exchange, state brute-force, and agency enumeration.
 */
export const rateLimitSso = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: Math.min(env.RATE_LIMIT_AUTH_MAX * 2, 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMIT", message: "Too many SSO attempts; try again later." },
  keyGenerator: (req) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
    const agencyId = (req.query?.agencyId as string)?.trim();
    return agencyId ? `${ip}:${agencyId}` : `${ip}:callback`;
  },
});
