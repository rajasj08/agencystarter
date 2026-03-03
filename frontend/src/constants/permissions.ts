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

/** Role -> permissions. SUPER_ADMIN has ADMIN_ALL which implies every permission. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [PERMISSIONS.ADMIN_ALL],
  [ROLES.AGENCY_ADMIN]: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.AGENCY_READ,
    PERMISSIONS.AGENCY_UPDATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ],
  [ROLES.AGENCY_MEMBER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.AGENCY_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
  [ROLES.USER]: [PERMISSIONS.USER_READ],
};
