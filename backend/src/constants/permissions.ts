/**
 * Single source for RBAC permissions.
 *
 * PLATFORM LEVEL (SuperAdmin only): agency:create, agency:delete, agency:list, admin:all.
 * TENANT LEVEL (agency-scoped): agency:read, agency:update, user:*, settings:*, role:*.
 */

/** DB enum: Permission.scope. Use for filtering and validation. */
export const PermissionScope = {
  PLATFORM: "PLATFORM",
  TENANT: "TENANT",
} as const;

export type PermissionScopeType = (typeof PermissionScope)[keyof typeof PermissionScope];

export const PERMISSIONS = {
  // Users (tenant)
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_LIST: "user:list",

  // Agency: platform vs tenant
  AGENCY_CREATE: "agency:create",
  AGENCY_READ: "agency:read",
  AGENCY_UPDATE: "agency:update",
  AGENCY_DELETE: "agency:delete",
  AGENCY_LIST: "agency:list",

  // Settings (tenant)
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Roles (tenant)
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",

  // Admin (platform)
  ADMIN_ALL: "admin:all",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LIST: Permission[] = Object.values(PERMISSIONS);

/** Platform-only: only SUPER_ADMIN may see and assign these. */
export const SUPERADMIN_ONLY_PERMISSION_KEYS = [
  PERMISSIONS.ADMIN_ALL,
  PERMISSIONS.AGENCY_CREATE,
  PERMISSIONS.AGENCY_DELETE,
  PERMISSIONS.AGENCY_LIST,
] as const;

/** Fields AGENCY_ADMIN may update on their own agency (tenant-level). */
export const AGENCY_TENANT_UPDATE_FIELDS = [
  "name",
  "logo",
  "websiteUrl",
  "supportEmail",
  "supportPhone",
  "contactFirstName",
  "contactLastName",
  "contactEmail",
  "contactPhone",
] as const;

/**
 * Permission keys for built-in tenant roles.
 * Single source of truth: prisma/seed-rbac.ts imports these to avoid drift.
 */
export const AGENCY_ADMIN_PERMISSION_KEYS: readonly string[] = [
  PERMISSIONS.USER_CREATE, PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE, PERMISSIONS.USER_LIST,
  PERMISSIONS.AGENCY_READ, PERMISSIONS.AGENCY_UPDATE,
  PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE,
  PERMISSIONS.ROLE_CREATE, PERMISSIONS.ROLE_READ, PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_DELETE,
];

export const AGENCY_MEMBER_PERMISSION_KEYS: readonly string[] = [
  PERMISSIONS.USER_READ, PERMISSIONS.USER_LIST, PERMISSIONS.AGENCY_READ, PERMISSIONS.SETTINGS_READ,
];

export const USER_PERMISSION_KEYS: readonly string[] = [PERMISSIONS.USER_READ];
