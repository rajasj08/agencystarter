/**
 * Seeds system permissions, system roles, and role-permission mappings.
 * Run as part of main seed. Idempotent (upsert by key/name).
 * Role permission keys are imported from src/constants/permissions.ts (single source of truth).
 */

import { PrismaClient } from "@prisma/client";
import {
  AGENCY_ADMIN_PERMISSION_KEYS,
  AGENCY_MEMBER_PERMISSION_KEYS,
  USER_PERMISSION_KEYS,
} from "../src/constants/permissions.js";

const prisma = new PrismaClient();

const PLATFORM_KEYS = ["admin:all", "agency:create", "agency:delete", "agency:list"] as const;

const SYSTEM_PERMISSIONS = [
  { key: "user:create", name: "Create users", description: "Create agency users" },
  { key: "user:read", name: "Read user", description: "View user details" },
  { key: "user:update", name: "Update user", description: "Edit user" },
  { key: "user:delete", name: "Delete user", description: "Remove user" },
  { key: "user:list", name: "List users", description: "View user list" },
  { key: "agency:read", name: "Read agency", description: "View agency details" },
  { key: "agency:update", name: "Update agency", description: "Edit agency (tenant fields)" },
  { key: "agency:create", name: "Create agency", description: "Create agency (platform)" },
  { key: "agency:list", name: "List agencies", description: "List agencies (platform)" },
  { key: "agency:delete", name: "Delete agency", description: "Delete agency (platform)" },
  { key: "settings:read", name: "Read settings", description: "View settings" },
  { key: "settings:update", name: "Update settings", description: "Edit settings" },
  { key: "role:create", name: "Create role", description: "Create agency role" },
  { key: "role:read", name: "Read role", description: "View roles and permissions" },
  { key: "role:update", name: "Update role", description: "Edit agency role" },
  { key: "role:delete", name: "Delete role", description: "Delete agency role" },
  { key: "admin:all", name: "Full access", description: "All permissions (platform)" },
] as const;

const platformKeysSet = new Set<string>(PLATFORM_KEYS);

export async function seedRbac(): Promise<{ roleSuperAdmin: { id: string } }> {
  for (const p of SYSTEM_PERMISSIONS) {
    const scope = platformKeysSet.has(p.key) ? "PLATFORM" : "TENANT";
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description ?? undefined, isSystem: true, scope },
      create: { key: p.key, name: p.name, description: p.description ?? undefined, isSystem: true, scope },
    });
  }

  // Platform role only (agencyId = null). Agency roles are created per-tenant via createAgencyRoles().
  let roleSuperAdmin = await prisma.role.findFirst({
    where: { name: "SUPER_ADMIN", agencyId: null, isSystem: true },
  });
  if (!roleSuperAdmin) {
    roleSuperAdmin = await prisma.role.create({
      data: {
        name: "SUPER_ADMIN",
        agencyId: null,
        isSystem: true,
        isEditable: false,
        isDeletable: false,
        isAssignable: false,
      },
    });
  } else {
    await prisma.role.update({
      where: { id: roleSuperAdmin.id },
      data: { isEditable: false, isDeletable: false, isAssignable: false },
    });
  }
  // SUPER_ADMIN: no RolePermission rows; middleware treats by name and grants admin:all

  return { roleSuperAdmin: { id: roleSuperAdmin.id } };
}

/** Idempotent: create AGENCY_ADMIN, AGENCY_MEMBER, USER for an agency (tenant-level roles). Call with same PrismaClient as seed. */
export async function createAgencyRoles(
  prismaInstance: PrismaClient,
  agencyId: string
): Promise<{
  roleAgencyAdmin: { id: string };
  roleAgencyMember: { id: string };
  roleUser: { id: string };
}> {
  const permIds = await prismaInstance.permission.findMany({ where: { isSystem: true }, select: { id: true, key: true } });
  const permMap = new Map(permIds.map((x) => [x.key, x.id]));

  const link = async (roleId: string, keys: readonly string[]) => {
    for (const key of keys) {
      const permissionId = permMap.get(key);
      if (!permissionId) continue;
      await prismaInstance.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  };

  const systemRoleFlags: Record<string, { isEditable: boolean; isDeletable: boolean; isAssignable: boolean }> = {
    AGENCY_ADMIN: { isEditable: false, isDeletable: false, isAssignable: true },
    AGENCY_MEMBER: { isEditable: false, isDeletable: false, isAssignable: true },
    USER: { isEditable: false, isDeletable: false, isAssignable: true },
  };

  const upsertAgencyRole = async (name: string) => {
    const existing = await prismaInstance.role.findFirst({
      where: { name, agencyId, isSystem: true },
    });
    const flags = systemRoleFlags[name] ?? { isEditable: true, isDeletable: true, isAssignable: true };
    if (existing) {
      await prismaInstance.role.update({
        where: { id: existing.id },
        data: flags,
      });
      return existing;
    }
    return prismaInstance.role.create({
      data: { name, agencyId, isSystem: true, ...flags },
    });
  };

  const roleAgencyAdmin = await upsertAgencyRole("AGENCY_ADMIN");
  const roleAgencyMember = await upsertAgencyRole("AGENCY_MEMBER");
  const roleUser = await upsertAgencyRole("USER");

  await link(roleAgencyAdmin.id, AGENCY_ADMIN_PERMISSION_KEYS);
  await link(roleAgencyMember.id, AGENCY_MEMBER_PERMISSION_KEYS);
  await link(roleUser.id, USER_PERMISSION_KEYS);

  return {
    roleAgencyAdmin: { id: roleAgencyAdmin.id },
    roleAgencyMember: { id: roleAgencyMember.id },
    roleUser: { id: roleUser.id },
  };
}
