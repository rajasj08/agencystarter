/**
 * Authorization utility layer — pure functions, no React.
 * Use for route/menu checks and in useAuthorization hook.
 * Safe against undefined/null; O(1) permission lookups via Set.
 */

const ADMIN_ALL = "admin:all";

export type PermissionInput = string | string[] | Set<string> | null | undefined;

function toSet(permissions: PermissionInput): Set<string> {
  if (permissions == null) return new Set();
  if (permissions instanceof Set) return permissions;
  const arr = Array.isArray(permissions) ? permissions : [permissions];
  return new Set(arr.filter((p): p is string => typeof p === "string" && p.length > 0));
}

/**
 * Check if user has a required permission.
 * When isSuperAdmin is true, returns true for any permission (superadmin bypass).
 */
export function hasPermission(
  userPermissions: PermissionInput,
  required: string,
  isSuperAdmin = false
): boolean {
  if (isSuperAdmin) return true;
  const set = toSet(userPermissions);
  if (set.size === 0) return false;
  if (set.has(ADMIN_ALL)) return true;
  return set.has(required);
}

/**
 * Check if user has at least one of the required permissions.
 */
export function hasAnyPermission(
  userPermissions: PermissionInput,
  required: PermissionInput,
  isSuperAdmin = false
): boolean {
  if (isSuperAdmin) return true;
  const userSet = toSet(userPermissions);
  if (userSet.size === 0) return false;
  if (userSet.has(ADMIN_ALL)) return true;
  const reqArr = required == null ? [] : Array.isArray(required) ? required : [required];
  return reqArr.some((p) => typeof p === "string" && userSet.has(p));
}

export interface RouteConfig {
  path: string;
  requiredPermission?: string | string[];
}

/**
 * Whether the user can access a route given route config.
 */
export function canAccessRoute(
  userPermissions: PermissionInput,
  routeConfig: RouteConfig,
  isSuperAdmin = false
): boolean {
  if (!routeConfig.requiredPermission) return true;
  return hasAnyPermission(userPermissions, routeConfig.requiredPermission, isSuperAdmin);
}

export interface MenuItemConfig {
  label: string;
  path: string;
  requiredPermission?: string | string[];
  requiredCapability?: string;
  children?: MenuItemConfig[];
}

/**
 * Whether the user can see this menu item (has required permission and optional capability).
 */
export function canRenderMenuItem(
  userPermissions: PermissionInput,
  menuConfig: MenuItemConfig,
  isSuperAdmin = false,
  userCapabilities?: Set<string> | string[] | null
): boolean {
  if (isSuperAdmin) return true;
  if (menuConfig.requiredPermission != null && !hasAnyPermission(userPermissions, menuConfig.requiredPermission, false))
    return false;
  if (menuConfig.requiredCapability != null) {
    if (!hasCapability(userCapabilities, menuConfig.requiredCapability)) return false;
  }
  return true;
}

/**
 * Filter menu config by permissions. Hides parents with no visible children.
 * Nested menus supported. Safe against null/undefined.
 */
export function filterMenuByPermissions(
  menuConfig: MenuItemConfig[],
  userPermissions: PermissionInput,
  isSuperAdmin = false,
  userCapabilities?: Set<string> | string[] | null
): MenuItemConfig[] {
  const permSet = toSet(userPermissions);
  const capSet = userCapabilities == null ? new Set<string>() : Array.isArray(userCapabilities) ? new Set(userCapabilities) : userCapabilities;

  function filter(items: MenuItemConfig[]): MenuItemConfig[] {
    const result: MenuItemConfig[] = [];
    for (const item of items) {
      const canShow = canRenderMenuItem(permSet, item, isSuperAdmin, capSet);
      const filteredChildren = item.children?.length ? filter(item.children) : undefined;
      const hasVisibleChildren = filteredChildren && filteredChildren.length > 0;
      if (canShow && (item.children == null || item.children.length === 0 || hasVisibleChildren)) {
        result.push({
          ...item,
          children: filteredChildren?.length ? filteredChildren : undefined,
        });
      }
    }
    return result;
  }

  return filter(menuConfig);
}

/**
 * Plan/capability check placeholder. When plan-based features are wired,
 * userCapabilities can come from agency subscription/plan.
 */
export function hasCapability(
  userCapabilities: Set<string> | string[] | null | undefined,
  required: string
): boolean {
  if (userCapabilities == null) return false;
  const set = Array.isArray(userCapabilities) ? new Set(userCapabilities) : userCapabilities;
  return set.has(required);
}
