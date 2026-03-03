/**
 * Global app config. Change branding and app metadata in one place.
 */

export const APP_CONFIG = {
  appName: "Agency Starter",
  version: "1.0.0",
  supportEmail: "support@example.com",
  logo: "/logo.svg",
} as const;

export type AppConfig = typeof APP_CONFIG;
