import { env } from "../../../config/env.js";
import { AppError } from "../../../errors/AppError.js";
import { ERROR_CODES } from "../../../constants/errorCodes.js";

const isProduction = env.NODE_ENV === "production";

let cachedOrigins: string[] | null = null;

/**
 * Allowed redirect origins derived from CORS_ORIGIN (comma-separated).
 * Used to validate redirect_uri and return_url to prevent open redirects.
 */
function getAllowedRedirectOrigins(): string[] {
  if (cachedOrigins) return cachedOrigins;
  const list = env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
  const origins: string[] = [];
  for (const entry of list) {
    try {
      origins.push(new URL(entry).origin);
    } catch {
      // skip malformed entries
    }
  }
  if (origins.length === 0) origins.push(new URL("http://localhost:3000").origin);
  cachedOrigins = origins;
  return origins;
}

/**
 * Validates that the given URL's origin is in the allowed list (CORS_ORIGIN).
 * Throws AppError if invalid. Use for redirect_uri and return_url.
 */
export function validateRedirectUri(uri: string): void {
  try {
    const url = new URL(uri);
    if (isProduction && url.protocol !== "https:") {
      throw new AppError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        "redirect_uri must use HTTPS in production",
        400
      );
    }
    const origin = url.origin;
    const allowed = getAllowedRedirectOrigins();
    if (!allowed.includes(origin)) {
      throw new AppError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        "redirect_uri is not allowed. It must match a configured frontend origin.",
        400
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Invalid redirect_uri", 400);
  }
}

/**
 * If returnUrl is provided and its origin is allowed, returns returnUrl; otherwise returns null.
 * Use when redirecting after SSO so we only redirect to allowed origins.
 */
export function getAllowedReturnUrl(returnUrl: string | null | undefined): string | null {
  if (!returnUrl || !returnUrl.trim()) return null;
  try {
    const origin = new URL(returnUrl).origin;
    const allowed = getAllowedRedirectOrigins();
    return allowed.includes(origin) ? returnUrl.trim() : null;
  } catch {
    return null;
  }
}
