import { prisma } from "../../lib/prisma.js";
import { audit } from "../../lib/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { RoleRepository } from "./role.repository.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { invalidateRole } from "../../services/RolePermissionCache.js";
import { ROLES } from "../../constants/roles.js";
import {
  AGENCY_ADMIN_PERMISSION_KEYS,
  AGENCY_MEMBER_PERMISSION_KEYS,
  USER_PERMISSION_KEYS,
} from "../../constants/permissions.js";

const roleRepo = new RoleRepository(prisma);

export interface PermissionDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  scope: string;
}

export interface RoleEditorDTO {
  id: string;
  name: string;
  email: string;
}

export interface RoleListItemDTO {
  id: string;
  name: string;
  agencyId: string | null;
  isSystem: boolean;
  permissionIds: string[];
}

export interface RoleDetailDTO extends RoleListItemDTO {
  updatedAt: string;
  updatedBy: RoleEditorDTO | null;
}

export class RolesService {
  /**
   * List permissions. For non–SUPER_ADMIN users, only TENANT scope (DB-enforced);
   * SUPER_ADMIN sees all (PLATFORM + TENANT).
   */
  async listPermissions(callerRole?: string | null): Promise<PermissionDTO[]> {
    const rows = await roleRepo.listPermissions();
    const filtered =
      callerRole === ROLES.SUPER_ADMIN
        ? rows
        : rows.filter((p) => p.scope === "TENANT");
    return filtered.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description ?? null,
      isSystem: p.isSystem,
      scope: p.scope,
    }));
  }

  async listRoles(agencyId: string | null): Promise<RoleListItemDTO[]> {
    const rows = await roleRepo.listRolesForAgency(agencyId);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      agencyId: r.agencyId,
      isSystem: r.isSystem,
      permissionIds: r.rolePermissions.map((rp) => rp.permissionId),
    }));
  }

  async getRoleById(id: string, agencyId: string | null): Promise<RoleDetailDTO | null> {
    const role = await roleRepo.findRoleById(id);
    if (!role) return null;
    if (role.agencyId !== agencyId) return null;
    return this.toRoleDetailDTO(role);
  }

  async createRole(
    agencyId: string,
    data: { name: string; permissionIds: string[] },
    currentUserPermissionIds?: string[],
    callerRole?: string | null,
    auditReq?: AuthRequest | null
  ): Promise<RoleDetailDTO> {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Role name is required", 400);
    if (callerRole !== ROLES.SUPER_ADMIN) {
      await this.rejectSuperadminOnlyPermissions(data.permissionIds);
    }
    if (currentUserPermissionIds !== undefined) {
      this.validatePermissionIdsSubset(data.permissionIds, currentUserPermissionIds);
    }
    await this.validatePermissionIds(data.permissionIds);
    const existing = await prisma.role.findFirst({
      where: { name: trimmedName, agencyId },
    });
    if (existing) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A role with this name already exists for this agency", 409);
    const role = await roleRepo.createRoleWithPermissions({
      name: trimmedName,
      agencyId,
      permissionIds: data.permissionIds,
    });
    if (!role) throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to create role", 500);
    if (auditReq?.user?.userId) {
      await audit(auditReq, {
        action: "role.permissions.created",
        resource: "role",
        resourceId: role.id,
        details: {
          roleName: trimmedName,
          permissionIds: data.permissionIds,
          createdBy: auditReq.user.userId,
        },
      });
    }
    return this.toRoleDetailDTO(role);
  }

  async updateRole(
    roleId: string,
    agencyId: string,
    data: { name?: string; permissionIds?: string[] },
    currentUserPermissionIds?: string[],
    callerRole?: string | null,
    auditReq?: AuthRequest | null
  ): Promise<RoleDetailDTO> {
    const role = await roleRepo.findRoleById(roleId);
    if (!role) throw new AppError(ERROR_CODES.NOT_FOUND, "Role not found", 404);
    if (role.isSystem) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "System roles cannot be edited", 403);
    if (role.agencyId !== agencyId) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Role does not belong to this agency", 403);
    const userId = auditReq?.user?.userId ?? null;
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Role name is required", 400);
      const existing = await prisma.role.findFirst({
        where: { name: trimmed, agencyId, id: { not: roleId } },
      });
      if (existing) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A role with this name already exists for this agency", 409);
      await roleRepo.updateRole(roleId, { name: trimmed, updatedById: userId });
    }
    if (data.permissionIds !== undefined) {
      if (callerRole !== ROLES.SUPER_ADMIN) {
        await this.rejectSuperadminOnlyPermissions(data.permissionIds);
      }
      if (currentUserPermissionIds !== undefined) {
        this.validatePermissionIdsSubset(data.permissionIds, currentUserPermissionIds);
      }
      await this.validatePermissionIds(data.permissionIds);
      const oldPermissionIds = role.rolePermissions.map((rp) => rp.permissionId);
      await roleRepo.updateRolePermissions(roleId, data.permissionIds);
      invalidateRole(roleId);
      await roleRepo.updateRole(roleId, { updatedById: userId });
      if (auditReq?.user?.userId) {
        await audit(auditReq, {
          action: "role.permissions.updated",
          resource: "role",
          resourceId: roleId,
          details: {
            roleName: role.name,
            oldPermissionIds,
            newPermissionIds: data.permissionIds,
            changedBy: auditReq.user.userId,
          },
        });
      }
    }
    const updated = await roleRepo.findRoleById(roleId);
    if (!updated) throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Role not found after update", 500);
    return this.toRoleDetailDTO(updated);
  }

  /**
   * Delete role only if: not a system role (e.g. built-in AGENCY_ADMIN), and no users assigned.
   * Explicit checks: isSystem → 403; userCount > 0 → 403.
   */
  async deleteRole(roleId: string, agencyId: string): Promise<void> {
    const role = await roleRepo.findRoleById(roleId);
    if (!role) throw new AppError(ERROR_CODES.NOT_FOUND, "Role not found", 404);
    if (role.isSystem) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "System roles (e.g. built-in AGENCY_ADMIN) cannot be deleted", 403);
    }
    if (role.agencyId !== agencyId) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Role does not belong to this agency", 403);
    const userCount = await prisma.user.count({ where: { roleId } });
    if (userCount > 0) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, `Cannot delete role: ${userCount} user(s) are assigned to it`, 403);
    }
    await roleRepo.deleteRole(roleId);
    invalidateRole(roleId);
  }

  private toRoleDetailDTO(role: {
    id: string;
    name: string;
    agencyId: string | null;
    isSystem: boolean;
    updatedAt: Date;
    rolePermissions: { permissionId: string }[];
    updatedBy?: { id: string; email: string; displayName: string | null; firstName: string | null; lastName: string | null } | null;
  }): RoleDetailDTO {
    let updatedBy: RoleEditorDTO | null = null;
    if (role.updatedBy) {
      const u = role.updatedBy;
      const name =
        u.displayName?.trim() ||
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        u.email;
      updatedBy = { id: u.id, name, email: u.email };
    }
    return {
      id: role.id,
      name: role.name,
      agencyId: role.agencyId,
      isSystem: role.isSystem,
      permissionIds: role.rolePermissions.map((rp) => rp.permissionId),
      updatedAt: role.updatedAt.toISOString(),
      updatedBy,
    };
  }

  /** Throws if any of the given permission IDs have scope PLATFORM (for non–SUPER_ADMIN callers). */
  private async rejectSuperadminOnlyPermissions(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) return;
    const perms = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { scope: true },
    });
    const disallowed = perms.filter((p) => p.scope === "PLATFORM");
    if (disallowed.length > 0) {
      throw new AppError(
        ERROR_CODES.PERMISSION_DENIED,
        "Some permissions are restricted to system administrators only.",
        403
      );
    }
  }

  private validatePermissionIdsSubset(permissionIds: string[], allowedIds: string[]): void {
    const allowedSet = new Set(allowedIds);
    const disallowed = permissionIds.filter((id) => !allowedSet.has(id));
    if (disallowed.length > 0) {
      throw new AppError(
        ERROR_CODES.PERMISSION_DENIED,
        "You can only assign permissions that you have. Remove the permissions you are not allowed to assign.",
        403
      );
    }
  }

  private async validatePermissionIds(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) return;
    const found = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });
    const foundSet = new Set(found.map((p) => p.id));
    const missing = permissionIds.filter((id) => !foundSet.has(id));
    if (missing.length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid permission id(s): ${missing.join(", ")}`, 400);
    }
  }

  /**
   * Idempotent: ensure AGENCY_ADMIN, AGENCY_MEMBER, USER roles exist for this agency (tenant).
   * Call when creating a new agency (onboarding or superadmin).
   */
  async ensureAgencyRoles(agencyId: string): Promise<{ roleAgencyAdminId: string }> {
    const rows = await roleRepo.listPermissions();
    const keyToId = new Map(rows.map((p) => [p.key, p.id]));

    const link = async (roleName: string, keys: readonly string[]) => {
      const role = await roleRepo.findOrCreateAgencyRole(agencyId, roleName);
      const permissionIds = keys.map((k) => keyToId.get(k)).filter(Boolean) as string[];
      if (permissionIds.length > 0) await roleRepo.updateRolePermissions(role.id, permissionIds);
      return role.id;
    };

    await link("AGENCY_ADMIN", AGENCY_ADMIN_PERMISSION_KEYS);
    await link("AGENCY_MEMBER", AGENCY_MEMBER_PERMISSION_KEYS);
    await link("USER", USER_PERMISSION_KEYS);
    const roleAgencyAdmin = await roleRepo.findRoleByNameAndAgency(agencyId, ROLES.AGENCY_ADMIN);
    if (!roleAgencyAdmin) throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to create agency roles", 500);
    return { roleAgencyAdminId: roleAgencyAdmin.id };
  }

  /** Returns permission IDs for the given role (for current-user validation). */
  async getPermissionIdsForRole(roleId: string): Promise<string[]> {
    const rows = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    return rows.map((r) => r.permissionId);
  }
}
