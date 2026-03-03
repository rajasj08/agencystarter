import { prisma } from "../../lib/prisma.js";
import { RoleRepository } from "./role.repository.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { invalidateRole } from "../../services/RolePermissionCache.js";

const roleRepo = new RoleRepository(prisma);

export interface PermissionDTO {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface RoleListItemDTO {
  id: string;
  name: string;
  agencyId: string | null;
  isSystem: boolean;
  permissionIds: string[];
}

export interface RoleDetailDTO extends RoleListItemDTO {}

export class RolesService {
  async listPermissions(): Promise<PermissionDTO[]> {
    const rows = await roleRepo.listPermissions();
    return rows.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description ?? null,
      isSystem: p.isSystem,
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
    if (role.isSystem) return this.toRoleDTO(role);
    if (role.agencyId !== agencyId) return null;
    return this.toRoleDTO(role);
  }

  async createRole(agencyId: string, data: { name: string; permissionIds: string[] }): Promise<RoleDetailDTO> {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Role name is required", 400);
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
    return this.toRoleDTO(role);
  }

  async updateRole(
    roleId: string,
    agencyId: string,
    data: { name?: string; permissionIds?: string[] }
  ): Promise<RoleDetailDTO> {
    const role = await roleRepo.findRoleById(roleId);
    if (!role) throw new AppError(ERROR_CODES.NOT_FOUND, "Role not found", 404);
    if (role.isSystem) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "System roles cannot be edited", 403);
    if (role.agencyId !== agencyId) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Role does not belong to this agency", 403);
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Role name is required", 400);
      const existing = await prisma.role.findFirst({
        where: { name: trimmed, agencyId, id: { not: roleId } },
      });
      if (existing) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A role with this name already exists for this agency", 409);
      await roleRepo.updateRole(roleId, { name: trimmed });
    }
    if (data.permissionIds !== undefined) {
      await this.validatePermissionIds(data.permissionIds);
      await roleRepo.updateRolePermissions(roleId, data.permissionIds);
      invalidateRole(roleId);
    }
    const updated = await roleRepo.findRoleById(roleId);
    if (!updated) throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Role not found after update", 500);
    return this.toRoleDTO(updated);
  }

  async deleteRole(roleId: string, agencyId: string): Promise<void> {
    const role = await roleRepo.findRoleById(roleId);
    if (!role) throw new AppError(ERROR_CODES.NOT_FOUND, "Role not found", 404);
    if (role.isSystem) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "System roles cannot be deleted", 403);
    if (role.agencyId !== agencyId) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Role does not belong to this agency", 403);
    const userCount = await prisma.user.count({ where: { roleId } });
    if (userCount > 0) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, `Cannot delete role: ${userCount} user(s) are assigned to it`, 403);
    }
    await roleRepo.deleteRole(roleId);
    invalidateRole(roleId);
  }

  private toRoleDTO(role: { id: string; name: string; agencyId: string | null; isSystem: boolean; rolePermissions: { permissionId: string }[] }): RoleDetailDTO {
    return {
      id: role.id,
      name: role.name,
      agencyId: role.agencyId,
      isSystem: role.isSystem,
      permissionIds: role.rolePermissions.map((rp) => rp.permissionId),
    };
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
}
