import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { UserRepository } from "./user.repository.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { RoleRepository } from "../roles/role.repository.js";
import { RolesService } from "../roles/roles.service.js";
import { toUserPublicDTO } from "./dto/index.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/userStatus.js";
import { env } from "../../config/env.js";
import { sendPasswordResetEmail } from "../../lib/mail.js";
import type { CreateUserInput, UpdateUserInput } from "./user.validation.js";
import type { PaginationOptions } from "../../types/index.js";
import { get as getSystemConfig } from "../../services/SystemConfigCache.js";
import { checkUserLimit } from "../../core/plans/planLimiter.js";

const userRepo = new UserRepository(prisma);
const authRepo = new AuthRepository(prisma);
const roleRepo = new RoleRepository(prisma);
const rolesService = new RolesService();

function userDisplayName(user: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string | null {
  if (user.displayName?.trim()) return user.displayName.trim();
  const parts = [user.firstName, user.lastName].filter((s) => s != null && String(s).trim() !== "");
  return parts.length > 0 ? parts.join(" ").trim() : null;
}

/** Ensure selected role's permissions are a subset of current user's (prevents privilege escalation). */
async function ensureRolePermissionsSubset(roleId: string, currentUserPermissionIds: string[]): Promise<void> {
  const rolePermissionIds = await rolesService.getPermissionIdsForRole(roleId);
  const allowedSet = new Set(currentUserPermissionIds);
  const disallowed = rolePermissionIds.filter((id) => !allowedSet.has(id));
  if (disallowed.length > 0) {
    throw new AppError(
      ERROR_CODES.PERMISSION_DENIED,
      "You can only assign roles whose permissions you have.",
      403
    );
  }
}

export class UserService {
  async list(agencyId: string, options: PaginationOptions) {
    const { data, total } = await userRepo.listByAgency(agencyId, {
      offset: options.offset,
      limit: options.limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return { data: data.map(toUserPublicDTO), total };
  }

  async getById(agencyId: string, id: string) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    return toUserPublicDTO(user);
  }

  async create(
    agencyId: string,
    input: CreateUserInput,
    options?: { currentUserPermissionIds?: string[] }
  ) {
    if (input.role === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot assign platform super admin role from tenant.", 403);
    }
    const config = getSystemConfig();
    if (config.maxUsersPerAgency != null && config.maxUsersPerAgency > 0) {
      const count = await prisma.user.count({ where: { agencyId, deletedAt: null } });
      if (count >= config.maxUsersPerAgency) {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, `Agency user limit reached (max ${config.maxUsersPerAgency})`, 403);
      }
    }
    await checkUserLimit(agencyId);
    const existing = await authRepo.findByEmail(input.email);
    if (existing) throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists", 409);
    const role = await roleRepo.findRoleByNameAndAgency(agencyId, input.role);
    if (!role) throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Role ${input.role} not found for this agency.`, 500);
    if (options?.currentUserPermissionIds !== undefined) {
      await ensureRolePermissionsSubset(role.id, options.currentUserPermissionIds);
    }
    const passwordHash = input.invite
      ? await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12)
      : await bcrypt.hash(input.password!, 12);
    const status = input.invite ? USER_STATUS.INVITED : USER_STATUS.ACTIVE;
    const user = await userRepo.create({
      email: input.email,
      passwordHash,
      displayName: input.name ?? null,
      roleId: role.id,
      status,
      agencyId,
    });
    if (input.invite) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await authRepo.createPasswordReset(user.id, token, expiresAt);
      const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, userDisplayName(user), link, "10080"); // 7 days in minutes
    }
    return toUserPublicDTO(user);
  }

  async update(
    agencyId: string,
    id: string,
    input: UpdateUserInput,
    options?: { currentUserPermissionIds?: string[]; currentUserId?: string; updatedById?: string | null }
  ) {
    if (input.role === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot assign platform super admin role from tenant.", 403);
    }
    if (options?.currentUserId && id === options.currentUserId && (input.status === "DISABLED" || input.status === "SUSPENDED")) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You cannot disable or suspend your own account.", 403);
    }
    const existing = await userRepo.getByIdForUpdate(id, agencyId);
    if (!existing) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    const existingRoleName = existing.roleRef?.name ?? existing.role;
    if (existingRoleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin user cannot be modified", 403);
    }
    let roleId: string | undefined;
    if (input.role !== undefined) {
      const role = await roleRepo.findRoleByNameAndAgency(agencyId, input.role);
      if (!role) throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Role ${input.role} not found for this agency.`, 500);
      if (options?.currentUserPermissionIds !== undefined) {
        await ensureRolePermissionsSubset(role.id, options.currentUserPermissionIds);
      }
      const isDemotingLastAdmin =
      existingRoleName === ROLES.AGENCY_ADMIN && role.name !== ROLES.AGENCY_ADMIN;
      if (isDemotingLastAdmin) {
        await prisma.$transaction(async (tx) => {
          const adminCount = await userRepo.countAgencyAdmins(agencyId, tx);
          if (adminCount <= 1) {
            throw new AppError(
              ERROR_CODES.PERMISSION_DENIED,
              "Cannot remove the last agency admin. Assign another admin first.",
              403
            );
          }
          await userRepo.update(
            id,
            agencyId,
            {
              ...(input.name !== undefined && { displayName: input.name }),
              roleId: role.id,
              ...(input.status !== undefined && { status: input.status as "ACTIVE" | "DISABLED" | "SUSPENDED" }),
              ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
            },
            tx
          );
        });
      } else {
        await userRepo.update(id, agencyId, {
          ...(input.name !== undefined && { displayName: input.name }),
          roleId: role.id,
          ...(input.status !== undefined && { status: input.status as "ACTIVE" | "DISABLED" | "SUSPENDED" }),
          ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
        });
      }
      roleId = role.id;
    } else {
      await userRepo.update(id, agencyId, {
        ...(input.name !== undefined && { displayName: input.name }),
        ...(input.status !== undefined && { status: input.status as "ACTIVE" | "DISABLED" | "SUSPENDED" }),
        ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
      });
    }
    const updated = await userRepo.findByIdAndAgency(id, agencyId);
    return toUserPublicDTO(updated!);
  }

  async delete(agencyId: string, id: string, options?: { currentUserId?: string }) {
    if (options?.currentUserId && id === options.currentUserId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You cannot delete your own account.", 403);
    }
    const existing = await userRepo.findByIdAndAgency(id, agencyId);
    if (!existing) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    const roleName = existing.roleRef?.name ?? existing.role;
    if (roleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin user cannot be deleted", 403);
    }
    if (roleName === ROLES.AGENCY_ADMIN) {
      await prisma.$transaction(async (tx) => {
        const adminCount = await userRepo.countAgencyAdmins(agencyId, tx);
        if (adminCount <= 1) {
          throw new AppError(
            ERROR_CODES.PERMISSION_DENIED,
            "Cannot delete the last agency admin. Assign another admin first.",
            403
          );
        }
        await userRepo.softDelete(id, agencyId, tx);
      });
    } else {
      await userRepo.softDelete(id, agencyId);
    }
  }

  async sendPasswordReset(agencyId: string, id: string) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    await authRepo.deletePasswordResetsByUserId(user.id);
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await authRepo.createPasswordReset(user.id, token, expiresAt);
    const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, userDisplayName(user), link, "60");
    return { message: "Password reset email sent" };
  }
}
