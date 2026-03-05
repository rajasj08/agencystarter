/**
 * Config-driven dashboard menu. Single source for nav items.
 * Visibility is determined by filterMenuByPermissions — no component-level permission checks.
 */

import type { LucideIcon } from "lucide-react";
import { Home, Users, Settings, Shield, UserCircle, FileText, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import type { MenuItemConfig } from "@/core/auth/authorization";
import { filterMenuByPermissions } from "@/core/auth/authorization";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  users: Users,
  settings: Settings,
  roles: Shield,
  profile: UserCircle,
  auditLogs: FileText,
  superadmin: ShieldCheck,
} as const;

export type MenuIconKey = keyof typeof iconMap;

export interface DashboardMenuItem extends MenuItemConfig {
  icon: MenuIconKey;
}

/** Dashboard nav: label, path, requiredPermission(s). Super Admin link requires ADMIN_ALL (platform). */
export const dashboardMenuConfig: DashboardMenuItem[] = [
  { label: "Dashboard", path: ROUTES.DASHBOARD, icon: "home" },
  { label: "Users", path: ROUTES.USERS, icon: "users", requiredPermission: PERMISSIONS.USER_LIST },
  { label: "Roles", path: ROUTES.ROLES, icon: "roles", requiredPermission: PERMISSIONS.ROLE_READ },
  { label: "Settings", path: ROUTES.SETTINGS, icon: "settings", requiredPermission: PERMISSIONS.SETTINGS_READ },
  { label: "Profile", path: ROUTES.PROFILE, icon: "profile" },
  { label: "Audit Logs", path: ROUTES.AUDIT_LOGS, icon: "auditLogs", requiredPermission: PERMISSIONS.SETTINGS_READ },
  { label: "Super Admin", path: ROUTES.SUPERADMIN, icon: "superadmin", requiredPermission: PERMISSIONS.ADMIN_ALL },
];

export function getMenuIcon(key: MenuIconKey): LucideIcon {
  return iconMap[key] ?? Home;
}

/**
 * Get menu items visible to the user. Memoize at call site if needed (e.g. in Sidebar with useMemo).
 */
export function getVisibleMenuItems(
  userPermissions: string[],
  isSuperAdmin: boolean,
  userCapabilities?: Set<string> | string[] | null
): DashboardMenuItem[] {
  return filterMenuByPermissions(
    dashboardMenuConfig,
    userPermissions,
    isSuperAdmin,
    userCapabilities
  ) as DashboardMenuItem[];
}
