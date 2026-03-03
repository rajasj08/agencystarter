/**
 * Role name constants. Permissions are resolved from DB (RolePermission + cache).
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  AGENCY_ADMIN: "AGENCY_ADMIN",
  AGENCY_MEMBER: "AGENCY_MEMBER",
  USER: "USER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST: Role[] = Object.values(ROLES);
