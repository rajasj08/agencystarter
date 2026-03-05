/**
 * Unit tests for authorization module (pure functions).
 * Run with: npx vitest run src/core/auth/__tests__/authorization.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  canAccessRoute,
  canRenderMenuItem,
  filterMenuByPermissions,
  hasCapability,
  type MenuItemConfig,
  type RouteConfig,
} from "../authorization";

describe("hasPermission", () => {
  it("returns true when isSuperAdmin", () => {
    expect(hasPermission([], "user:create", true)).toBe(true);
    expect(hasPermission(["user:read"], "user:create", true)).toBe(true);
  });

  it("returns false when no permissions and not superadmin", () => {
    expect(hasPermission([], "user:create", false)).toBe(false);
    expect(hasPermission(null, "user:create")).toBe(false);
  });

  it("returns true when user has admin:all", () => {
    expect(hasPermission(["admin:all"], "user:create")).toBe(true);
    expect(hasPermission(["admin:all"], "role:delete")).toBe(true);
  });

  it("returns true when user has exact permission", () => {
    expect(hasPermission(["user:create", "user:read"], "user:create")).toBe(true);
    expect(hasPermission(new Set(["user:create"]), "user:create")).toBe(true);
  });

  it("returns false when user lacks permission", () => {
    expect(hasPermission(["user:read"], "user:create")).toBe(false);
    expect(hasPermission(["user:create"], "user:delete")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("returns true when isSuperAdmin", () => {
    expect(hasAnyPermission([], ["user:create", "user:delete"], true)).toBe(true);
  });

  it("returns true when user has any of required", () => {
    expect(hasAnyPermission(["user:read"], "user:read")).toBe(true);
    expect(hasAnyPermission(["user:read", "user:create"], ["user:delete", "user:create"])).toBe(true);
  });

  it("returns false when user has none", () => {
    expect(hasAnyPermission(["user:read"], ["user:create", "user:delete"])).toBe(false);
  });

  it("returns true when user has admin:all", () => {
    expect(hasAnyPermission(["admin:all"], ["role:delete"])).toBe(true);
  });
});

describe("canAccessRoute", () => {
  it("returns true when no requiredPermission", () => {
    expect(canAccessRoute([], { path: "/" })).toBe(true);
  });

  it("returns true when user has permission", () => {
    const config: RouteConfig = { path: "/users", requiredPermission: "user:list" };
    expect(canAccessRoute(["user:list"], config)).toBe(true);
    expect(canAccessRoute(["user:list"], config, true)).toBe(true);
  });

  it("returns false when user lacks permission", () => {
    const config: RouteConfig = { path: "/users", requiredPermission: "user:list" };
    expect(canAccessRoute(["user:read"], config)).toBe(false);
  });
});

describe("canRenderMenuItem", () => {
  it("returns true when isSuperAdmin", () => {
    expect(canRenderMenuItem([], { label: "Admin", path: "/admin", requiredPermission: "admin:all" }, true)).toBe(true);
  });

  it("returns true when no required permission/capability", () => {
    expect(canRenderMenuItem([], { label: "Home", path: "/" })).toBe(true);
  });

  it("returns false when lacks required permission", () => {
    expect(canRenderMenuItem(["user:read"], { label: "Users", path: "/users", requiredPermission: "user:list" }, false)).toBe(false);
  });

  it("returns false when lacks required capability", () => {
    expect(canRenderMenuItem(["user:list"], { label: "Advanced", path: "/adv", requiredPermission: "user:list", requiredCapability: "ADVANCED" }, false, [])).toBe(false);
    expect(canRenderMenuItem(["user:list"], { label: "Advanced", path: "/adv", requiredPermission: "user:list", requiredCapability: "ADVANCED" }, false, new Set(["ADVANCED"]))).toBe(true);
  });
});

describe("filterMenuByPermissions", () => {
  it("hides items without permission", () => {
    const menu: MenuItemConfig[] = [
      { label: "A", path: "/a" },
      { label: "B", path: "/b", requiredPermission: "user:create" },
    ];
    const filtered = filterMenuByPermissions(menu, ["user:read"], false);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].label).toBe("A");
  });

  it("hides parent when no visible children", () => {
    const menu: MenuItemConfig[] = [
      {
        label: "Parent",
        path: "/p",
        children: [
          { label: "Child", path: "/p/c", requiredPermission: "admin:all" },
        ],
      },
    ];
    const filtered = filterMenuByPermissions(menu, ["user:read"], false);
    expect(filtered).toHaveLength(0);
  });

  it("shows parent when at least one child visible", () => {
    const menu: MenuItemConfig[] = [
      {
        label: "Parent",
        path: "/p",
        children: [
          { label: "Child1", path: "/p/c1", requiredPermission: "admin:all" },
          { label: "Child2", path: "/p/c2", requiredPermission: "user:read" },
        ],
      },
    ];
    const filtered = filterMenuByPermissions(menu, ["user:read"], false);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].children).toHaveLength(1);
    expect(filtered[0].children![0].label).toBe("Child2");
  });
});

describe("hasCapability", () => {
  it("returns false when capabilities null/undefined", () => {
    expect(hasCapability(null, "ADVANCED")).toBe(false);
    expect(hasCapability(undefined, "ADVANCED")).toBe(false);
  });

  it("returns true when capability present", () => {
    expect(hasCapability(["ADVANCED"], "ADVANCED")).toBe(true);
    expect(hasCapability(new Set(["ADVANCED"]), "ADVANCED")).toBe(true);
  });

  it("returns false when capability absent", () => {
    expect(hasCapability(["BASIC"], "ADVANCED")).toBe(false);
  });
});
