/**
 * Single source for environment configuration.
 * Never use process.env directly in application code.
 * Load backend/.env via dotenv in server.ts before this is imported.
 */

function required(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

const isDev = process.env.NODE_ENV !== "production";

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: parseInt(optional("PORT", "4000"), 10),

  // Database (dev default so server starts without .env; set in production)
  // In test, prefer DATABASE_URL_TEST so tests never touch dev DB.
  DATABASE_URL:
    process.env.NODE_ENV === "test" && process.env.DATABASE_URL_TEST
      ? process.env.DATABASE_URL_TEST
      : isDev
        ? optional("DATABASE_URL", "postgresql://localhost:5432/agencystarter")
        : required("DATABASE_URL"),

  // JWT (dev default for local run; must set in production)
  JWT_SECRET: isDev ? optional("JWT_SECRET", "dev-secret-change-in-production") : required("JWT_SECRET"),
  REQUIRE_EMAIL_VERIFICATION: optional("REQUIRE_EMAIL_VERIFICATION", "false") === "true",

  // API
  API_PREFIX: optional("API_PREFIX", "/api/v1"),

  // CORS / App URL (frontend origin; used in email links)
  CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:3000"),
  APP_NAME: optional("APP_NAME", "Agency Starter"),

  // Rate limit (global for API; auth routes use stricter limit)
  RATE_LIMIT_WINDOW_MS: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10),
  RATE_LIMIT_MAX: parseInt(optional("RATE_LIMIT_MAX", "300"), 10),
  RATE_LIMIT_AUTH_WINDOW_MS: parseInt(optional("RATE_LIMIT_AUTH_WINDOW_MS", "60000"), 10),
  RATE_LIMIT_AUTH_MAX: parseInt(optional("RATE_LIMIT_AUTH_MAX", "10"), 10),

  // Maintenance & limits
  MAINTENANCE_MODE: optional("MAINTENANCE_MODE", "false") === "true",
  MAX_USERS_PER_AGENCY: parseInt(optional("MAX_USERS_PER_AGENCY", "0"), 10) || undefined,
  MAX_AGENCIES: parseInt(optional("MAX_AGENCIES", "0"), 10) || undefined,

  // Superadmin seed (optional; if both set and no superadmin exists, one is created on startup)
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL ?? "",
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ?? "",

  // Email (optional for dev)
  SMTP_HOST: optional("SMTP_HOST", ""),
  SMTP_PORT: parseInt(optional("SMTP_PORT", "587"), 10),
  SMTP_USER: optional("SMTP_USER", ""),
  SMTP_PASS: optional("SMTP_PASS", ""),
  SMTP_FROM: optional("SMTP_FROM", "noreply@example.com"),
} as const;

export type Env = typeof env;
