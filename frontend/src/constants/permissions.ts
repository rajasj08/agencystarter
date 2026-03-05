/**
 * Frontend mirror of backend RBAC permissions.
 * Keep in sync with backend/src/constants/permissions.ts
 */

export const PERMISSIONS = {
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_LIST: "user:list",
  AGENCY_CREATE: "agency:create",
  AGENCY_READ: "agency:read",
  AGENCY_UPDATE: "agency:update",
  AGENCY_DELETE: "agency:delete",
  AGENCY_LIST: "agency:list",
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ADMIN_ALL: "admin:all",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  AGENCY_ADMIN: "AGENCY_ADMIN",
  AGENCY_MEMBER: "AGENCY_MEMBER",
  USER: "USER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Permissions come from backend only (login / me). No frontend derivation.
 * ROLES and PERMISSIONS are for display and constant reference only.
 */
