import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { emitSecurityEvent } from "../lib/securityEvents.js";

/** Anti-enumeration limiter for public agency slug lookup used by login page. */
export const rateLimitAgencyLookup = rateLimit({
  windowMs: env.RATE_LIMIT_AGENCY_LOOKUP_WINDOW_MS,
  max: env.RATE_LIMIT_AGENCY_LOOKUP_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMIT", message: "Too many lookup attempts. Try again later." },
  handler: (req, res) => {
    emitSecurityEvent("tenant_slug_probe_spike", {
      path: req.path,
      ip: req.ip,
      ua: req.headers["user-agent"] ?? null,
    });
    res.status(429).json({ success: false, code: "RATE_LIMIT", message: "Too many lookup attempts. Try again later." });
  },
});

