/**
 * Seeds system permissions, system roles, and role-permission mappings.
 * Run as part of main seed. Idempotent (upsert by key/name).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_PERMISSIONS = [
  { key: "user:create", name: "Create users", description: "Create agency users" },
  { key: "user:read", name: "Read user", description: "View user details" },
  { key: "user:update", name: "Update user", description: "Edit user" },
  { key: "user:delete", name: "Delete user", description: "Remove user" },
  { key: "user:list", name: "List users", description: "View user list" },
  { key: "agency:read", name: "Read agency", description: "View agency details" },
  { key: "agency:update", name: "Update agency", description: "Edit agency" },
  { key: "agency:create", name: "Create agency", description: "Create agency (onboarding)" },
  { key: "agency:list", name: "List agencies", description: "List agencies" },
  { key: "agency:delete", name: "Delete agency", description: "Delete agency" },
  { key: "settings:read", name: "Read settings", description: "View settings" },
  { key: "settings:update", name: "Update settings", description: "Edit settings" },
  { key: "admin:all", name: "Full access", description: "All permissions (system)" },
] as const;

const AGENCY_ADMIN_PERMISSION_KEYS = [
  "user:create", "user:read", "user:update", "user:delete", "user:list",
  "agency:read", "agency:update", "agency:create", "agency:list",
  "settings:read", "settings:update",
] as const;

const AGENCY_MEMBER_PERMISSION_KEYS = [
  "user:read", "user:list", "agency:read", "settings:read",
] as const;

const USER_PERMISSION_KEYS = ["user:read"] as const;

export async function seedRbac(): Promise<{
  roleSuperAdmin: { id: string };
  roleAgencyAdmin: { id: string };
  roleAgencyMember: { id: string };
  roleUser: { id: string };
}> {
  for (const p of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description ?? undefined, isSystem: true },
      create: { key: p.key, name: p.name, description: p.description ?? undefined, isSystem: true },
    });
  }

  const permIds = await prisma.permission.findMany({ where: { isSystem: true }, select: { id: true, key: true } });
  const permMap = new Map(permIds.map((x) => [x.key, x.id]));

  const upsertSystemRole = async (name: string) => {
    const existing = await prisma.role.findFirst({
      where: { name, agencyId: null, isSystem: true },
    });
    if (existing) return existing;
    return prisma.role.create({
      data: { name, agencyId: null, isSystem: true },
    });
  };

  const roleSuperAdmin = await upsertSystemRole("SUPER_ADMIN");
  const roleAgencyAdmin = await upsertSystemRole("AGENCY_ADMIN");
  const roleAgencyMember = await upsertSystemRole("AGENCY_MEMBER");
  const roleUser = await upsertSystemRole("USER");

  const link = async (roleId: string, keys: readonly string[]) => {
    for (const key of keys) {
      const permissionId = permMap.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  };

  await link(roleAgencyAdmin.id, AGENCY_ADMIN_PERMISSION_KEYS);
  await link(roleAgencyMember.id, AGENCY_MEMBER_PERMISSION_KEYS);
  await link(roleUser.id, USER_PERMISSION_KEYS);
  // SUPER_ADMIN: no RolePermission rows; middleware treats by name and grants admin:all

  return {
    roleSuperAdmin: { id: roleSuperAdmin.id },
    roleAgencyAdmin: { id: roleAgencyAdmin.id },
    roleAgencyMember: { id: roleAgencyMember.id },
    roleUser: { id: roleUser.id },
  };
}
