/**
 * Single source for frontend routes.
 */

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_EMAIL: "/verify-email",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  ONBOARDING: "/onboarding",
  USERS: "/dashboard/users",
  USER_CREATE: "/dashboard/users/create",
  USER_VIEW: (id: string) => `/dashboard/users/${id}`,
  USER_EDIT: (id: string) => `/dashboard/users/${id}/edit`,
  ROLES: "/dashboard/roles",
  ROLE_CREATE: "/dashboard/roles/create",
  ROLE_VIEW: (id: string) => `/dashboard/roles/${id}`,
  ROLE_EDIT: (id: string) => `/dashboard/roles/${id}/edit`,
  SETTINGS: "/dashboard/settings",
  SETTINGS_GENERAL: "/dashboard/settings/general",
  SETTINGS_SECURITY: "/dashboard/settings/security",
  SETTINGS_EMAIL: "/dashboard/settings/email",
  SETTINGS_USERS: "/dashboard/settings/users",
  PROFILE: "/dashboard/profile",
  AUDIT_LOGS: "/dashboard/audit-logs",
  // SuperAdmin (SUPER_ADMIN only)
  SUPERADMIN: "/superadmin",
  SUPERADMIN_AGENCIES: "/superadmin/agencies",
  SUPERADMIN_AGENCIES_CREATE: "/superadmin/agencies/create",
  SUPERADMIN_AGENCY_EDIT: (id: string) => `/superadmin/agencies/${id}/edit`,
  SUPERADMIN_USERS: "/superadmin/users",
  SUPERADMIN_USERS_CREATE: "/superadmin/users/create",
  SUPERADMIN_USER_EDIT: (id: string) => `/superadmin/users/${id}/edit`,
  SUPERADMIN_PLANS: "/superadmin/plans",
  SUPERADMIN_PLANS_CREATE: "/superadmin/plans/create",
  SUPERADMIN_PLAN_EDIT: (id: string) => `/superadmin/plans/${id}/edit`,
  SUPERADMIN_SYSTEM_SETTINGS: "/superadmin/system-settings",
  SUPERADMIN_AUDIT: "/superadmin/audit",
} as const;

export type RouteKey = keyof typeof ROUTES;
