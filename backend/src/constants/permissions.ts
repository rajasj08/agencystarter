/**
 * Single source for RBAC permissions.
 */

export const PERMISSIONS = {
  // Users
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_LIST: "user:list",

  // Agency
  AGENCY_CREATE: "agency:create",
  AGENCY_READ: "agency:read",
  AGENCY_UPDATE: "agency:update",
  AGENCY_DELETE: "agency:delete",
  AGENCY_LIST: "agency:list",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Admin (super)
  ADMIN_ALL: "admin:all",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LIST: Permission[] = Object.values(PERMISSIONS);
