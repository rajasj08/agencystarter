import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/** Hash of sorted permission IDs for tamper detection. */
function permissionsChecksum(permissionIds: string[]): string {
  const sorted = [...permissionIds].sort();
  return crypto.createHash("sha256").update(sorted.join(",")).digest("hex");
}

export class RoleRepository {
  constructor(private prisma: PrismaClient) {}

  /** Platform role only (SUPER_ADMIN). */
  findSystemRoleByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name, agencyId: null, isSystem: true },
    });
  }

  /** Tenant role: by name and agency (for user assignation). */
  findRoleByNameAndAgency(agencyId: string, name: string) {
    return this.prisma.role.findFirst({
      where: { name, agencyId, isSystem: true },
    });
  }

  /** Idempotent: get or create a built-in agency role (AGENCY_ADMIN, AGENCY_MEMBER, USER). */
  async findOrCreateAgencyRole(agencyId: string, name: string) {
    const existing = await this.prisma.role.findFirst({
      where: { name, agencyId, isSystem: true },
    });
    if (existing) return existing;
    return this.prisma.role.create({
      data: { name, agencyId, isSystem: true },
    });
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, name: true, description: true, isSystem: true, scope: true },
    });
  }

  /** Check if another role (excluding excludeRoleId) exists with this name in the agency. For uniqueness validation. */
  findRoleByNameAndAgencyExcludingId(name: string, agencyId: string, excludeRoleId: string) {
    return this.prisma.role.findFirst({
      where: { name, agencyId, id: { not: excludeRoleId } },
      select: { id: true },
    });
  }

  getPermissionIdsForRole(roleId: string) {
    return this.prisma.rolePermission
      .findMany({ where: { roleId }, select: { permissionId: true } })
      .then((rows) => rows.map((r) => r.permissionId));
  }

  /** Tenant: roles for this agency only. Superadmin (agencyId null): only platform role(s). */
  listRolesForAgency(agencyId: string | null) {
    return this.prisma.role.findMany({
      where: agencyId != null ? { agencyId } : { agencyId: null },
      orderBy: { name: "asc" },
      include: {
        rolePermissions: { select: { permissionId: true } },
      },
    });
  }

  findRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { select: { permissionId: true } },
        updatedBy: {
          select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Fetch role only if it belongs to the given agency (or platform when agencyId is null).
   * Enforces tenant isolation at query level: DB never returns another tenant's role.
   */
  findRoleByIdAndAgency(id: string, agencyId: string | null) {
    return this.prisma.role.findFirst({
      where: { id, agencyId: agencyId ?? null },
      include: {
        rolePermissions: { select: { permissionId: true } },
        updatedBy: {
          select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Update role only if it belongs to the given agency. No-op if wrong agency (returns 0 updated).
   */
  updateRoleScoped(id: string, agencyId: string | null, data: { name?: string; updatedById?: string | null }) {
    return this.prisma.role.updateMany({
      where: { id, agencyId: agencyId ?? null },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.updatedById !== undefined && { updatedById: data.updatedById }),
      },
    });
  }

  /**
   * Delete role only if it belongs to the given agency. No-op if wrong agency (returns 0 deleted).
   */
  deleteRoleScoped(id: string, agencyId: string | null) {
    return this.prisma.role.deleteMany({
      where: { id, agencyId: agencyId ?? null },
    });
  }

  /** Create custom role for an agency with permissions. */
  async createRoleWithPermissions(data: { name: string; agencyId: string; permissionIds: string[] }) {
    const checksum = data.permissionIds.length > 0 ? permissionsChecksum(data.permissionIds) : null;
    const role = await this.prisma.role.create({
      data: { name: data.name, agencyId: data.agencyId, isSystem: false, permissionsChecksum: checksum },
    });
    if (data.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      });
    }
    return this.findRoleById(role.id)!;
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
    const checksum = permissionIds.length > 0 ? permissionsChecksum(permissionIds) : null;
    await this.prisma.role.update({
      where: { id: roleId },
      data: { permissionsVersion: { increment: 1 }, permissionsChecksum: checksum },
    });
    return this.findRoleById(roleId)!;
  }

  updateRole(id: string, data: { name?: string; updatedById?: string | null }) {
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.updatedById !== undefined && { updatedById: data.updatedById }),
      },
      include: {
        rolePermissions: { select: { permissionId: true } },
        updatedBy: {
          select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
        },
      },
    });
  }

  deleteRole(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }
}
