/**
 * Config-driven navigation. Single source for sidebar/dashboard nav.
 * Supports future RBAC and multi-tenant visibility.
 */

import type { LucideIcon } from "lucide-react";
import { Home, Users, Settings, Shield, UserCircle, FileText, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  users: Users,
  settings: Settings,
  roles: Shield,
  profile: UserCircle,
  auditLogs: FileText,
  superadmin: ShieldCheck,
} as const;

export type NavIconKey = keyof typeof iconMap;

export interface NavItem {
  title: string;
  href: string;
  icon: NavIconKey;
  /** Optional: for future RBAC or tenant visibility */
  permission?: string;
  /** Optional: hide from nav (e.g. tenant-specific) */
  visible?: boolean;
  /** If true, only show when user.role === SUPER_ADMIN */
  superAdminOnly?: boolean;
}

export const navigation: NavItem[] = [
  { title: "Dashboard", href: ROUTES.DASHBOARD, icon: "home" },
  { title: "Users", href: ROUTES.USERS, icon: "users" },
  { title: "Roles", href: ROUTES.ROLES, icon: "roles" },
  { title: "Settings", href: ROUTES.SETTINGS, icon: "settings" },
  { title: "Profile", href: ROUTES.PROFILE, icon: "profile" },
  { title: "Audit Logs", href: ROUTES.AUDIT_LOGS, icon: "auditLogs" },
  { title: "Super Admin", href: ROUTES.SUPERADMIN, icon: "superadmin", superAdminOnly: true },
];

export function getNavIcon(key: NavIconKey): LucideIcon {
  return iconMap[key] ?? Home;
}
