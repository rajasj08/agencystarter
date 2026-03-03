/**
 * Module registry. Used for documentation, future enable/disable, or plugin discovery.
 * Register all API modules here.
 */
export const MODULES = [
  "auth",
  "agencies",
  "settings",
  "users",
  "notifications",
  "platform",
  "superadmin",
] as const;

export type ModuleName = (typeof MODULES)[number];
