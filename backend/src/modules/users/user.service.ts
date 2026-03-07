import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  userRepository as userRepo,
  authRepository as authRepo,
  roleRepository as roleRepo,
  getPrismaForInternalUse,
} from "../../lib/data-access.js";
import { RolesService } from "../roles/roles.service.js";
import { toUserPublicDTO } from "./dto/index.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/userStatus.js";
import { env } from "../../config/env.js";
import { sendPasswordResetEmail, sendPasswordResetByAdminEmail } from "../../lib/mail.js";
import type { CreateUserInput, UpdateUserInput } from "./user.validation.js";
import type { PaginationOptions } from "../../types/index.js";
import { get as getSystemConfig } from "../../services/SystemConfigCache.js";
import { checkUserLimit } from "../../core/plans/planLimiter.js";

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

/** Resolve role for create: prefer roleId, else role name (legacy). */
async function resolveRoleForCreate(
  agencyId: string,
  input: CreateUserInput
) {
  if (input.roleId) return roleRepo.findRoleByIdAndAgency(input.roleId, agencyId);
  if (input.role) return roleRepo.findRoleByNameAndAgency(agencyId, input.role);
  return null;
}

const USER_LIST_SORT_FIELDS = ["name", "email", "role", "status", "createdAt"] as const;

export class UserService {
  async list(agencyId: string, options: PaginationOptions) {
    const sortBy =
      options.sortBy && USER_LIST_SORT_FIELDS.includes(options.sortBy as (typeof USER_LIST_SORT_FIELDS)[number])
        ? options.sortBy === "name"
          ? "displayName"
          : options.sortBy
        : "createdAt";
    const sortOrder = options.sortOrder ?? "desc";
    const { data, total } = await userRepo.listByAgency(agencyId, {
      offset: options.offset,
      limit: options.limit,
      sortBy,
      sortOrder,
      search: options.search,
      status: options.status,
    });
    return { data: data.map(toUserPublicDTO), total };
  }

  /** Get user by id. Returns deleted users (with deletedAt) so edit page can show read-only restore view; does not 404. */
  async getById(agencyId: string, id: string) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (user) return toUserPublicDTO(user);
    const deleted = await userRepo.findByIdAndAgencyIncludingDeleted(id, agencyId);
    if (deleted) return toUserPublicDTO(deleted);
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
  }

  async create(
    agencyId: string,
    input: CreateUserInput,
    options?: { currentUserPermissionIds?: string[]; callerIsSuperAdmin?: boolean }
  ) {
    const role = await resolveRoleForCreate(agencyId, input);
    if (!role) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Role not found or does not belong to this agency.", 400);
    if (role.name === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot assign platform super admin role from tenant.", 403);
    }
    const config = getSystemConfig();
    if (config.maxUsersPerAgency != null && config.maxUsersPerAgency > 0) {
      const count = await userRepo.countActiveByAgency(agencyId);
      if (count >= config.maxUsersPerAgency) {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, `Agency user limit reached (max ${config.maxUsersPerAgency})`, 403);
      }
    }
    await checkUserLimit(agencyId);
    const existing = await authRepo.findByEmail(input.email);
    if (existing) throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists", 409);
    if (!role.isAssignable && !options?.callerIsSuperAdmin) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "This role cannot be assigned to users.", 403);
    }
    if (options?.currentUserPermissionIds !== undefined) {
      await ensureRolePermissionsSubset(role.id, options.currentUserPermissionIds);
    }
    const invite = input.invite === true;
    const passwordHash = invite ? null : await bcrypt.hash(input.password!, 12);
    const status = invite ? USER_STATUS.INVITED : USER_STATUS.ACTIVE;
    const emailVerifiedAt = invite ? null : new Date();

    const deletedUser = await authRepo.findByEmailIncludingDeleted(input.email);
    if (deletedUser?.deletedAt != null) {
      if (deletedUser.agencyId !== agencyId) {
        throw new AppError(
          ERROR_CODES.USER_ALREADY_EXISTS,
          "A user with this email was previously in another organization. Contact support if you need to reassign them.",
          409
        );
      }
      const user = await authRepo.restoreUserForAdmin(deletedUser.id, {
        roleId: role.id,
        status,
        passwordHash: passwordHash ?? (await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12)),
        displayName: input.displayName ?? input.name ?? null,
      });
      if (invite) {
        await this.sendInvitationEmail(user);
      }
      return toUserPublicDTO(user);
    }

    const user = await userRepo.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName ?? input.name ?? null,
      roleId: role.id,
      status,
      agencyId,
      emailVerifiedAt,
    });
    if (invite) {
      await this.sendInvitationEmail(user);
    }
    return toUserPublicDTO(user);
  }

  /** Send invitation email (set-password link) for INVITED users. */
  private async sendInvitationEmail(user: { id: string; email: string; displayName?: string | null; firstName?: string | null; lastName?: string | null }) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepo.createPasswordReset(user.id, token, expiresAt);
    const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, userDisplayName(user), link, "10080"); // 7 days in minutes
  }

  async update(
    agencyId: string,
    id: string,
    input: UpdateUserInput,
    options?: { currentUserPermissionIds?: string[]; currentUserId?: string; updatedById?: string | null; callerIsSuperAdmin?: boolean }
  ) {
    const existing = await userRepo.getByIdForUpdate(id, agencyId);
    if (!existing) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    const isPending = existing.status === "INVITED" || existing.status === "PENDING_VERIFICATION";
    if (isPending && input.status !== undefined) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Cannot set status for users who have not completed account setup. Use Activate or Set password instead.",
        400
      );
    }
    if (options?.currentUserId && id === options.currentUserId && (input.status === "DISABLED" || input.status === "SUSPENDED")) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You cannot disable or suspend your own account.", 403);
    }
    const existingRoleName = existing.roleRef?.name ?? existing.role;
    if (existingRoleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin user cannot be modified", 403);
    }
    const statusPayload = isPending ? undefined : input.status;
    let newRoleId: string | undefined;
    if (input.roleId !== undefined) {
      const role = await roleRepo.findRoleByIdAndAgency(input.roleId, agencyId);
      if (!role) throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Role not found or does not belong to this agency.", 400);
      if (role.name === ROLES.SUPER_ADMIN) {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot assign platform super admin role from tenant.", 403);
      }
      if (!role.isAssignable && !options?.callerIsSuperAdmin) {
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, "This role cannot be assigned to users.", 403);
      }
      if (options?.currentUserPermissionIds !== undefined) {
        await ensureRolePermissionsSubset(role.id, options.currentUserPermissionIds);
      }
      const isDemotingLastAdmin =
      existingRoleName === ROLES.AGENCY_ADMIN && role.name !== ROLES.AGENCY_ADMIN;
      if (isDemotingLastAdmin) {
        const prisma = getPrismaForInternalUse();
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
              ...(statusPayload !== undefined && { status: statusPayload as "ACTIVE" | "DISABLED" | "SUSPENDED" }),
              ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
              ...(statusPayload === "ACTIVE" && { emailVerifiedAt: new Date() }),
            },
            tx
          );
        });
      } else {
        await userRepo.update(id, agencyId, {
          ...(input.name !== undefined && { displayName: input.name }),
          roleId: role.id,
          ...(statusPayload !== undefined && { status: statusPayload as "ACTIVE" | "DISABLED" | "SUSPENDED" }),
          ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
          ...(statusPayload === "ACTIVE" && { emailVerifiedAt: new Date() }),
        });
      }
      newRoleId = role.id;
    } else {
      await userRepo.update(id, agencyId, {
        ...(input.name !== undefined && { displayName: input.name }),
        ...(statusPayload !== undefined && { status: statusPayload as "ACTIVE" | "DISABLED" | "SUSPENDED" }),
        ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
        ...(statusPayload === "ACTIVE" && { emailVerifiedAt: new Date() }),
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
      throw new AppError(
        ERROR_CODES.PERMISSION_DENIED,
        "Cannot delete an agency admin. Demote the user to another role first.",
        403
      );
    }
    await userRepo.softDelete(id, agencyId, { updatedById: options?.currentUserId ?? null });
  }

  /** Send password reset email (admin-initiated from edit user page). Does not change user status. Uses admin-specific copy. */
  async sendPasswordReset(agencyId: string, id: string) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    await authRepo.deletePasswordResetsByUserId(user.id);
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await authRepo.createPasswordReset(user.id, token, expiresAt);
    const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    await sendPasswordResetByAdminEmail(user.email, userDisplayName(user), link, "60");
    return { message: "Password reset email sent", email: user.email };
  }

  /** Activate user: set status=ACTIVE and emailVerifiedAt=now. Allowed from INVITED, PENDING_VERIFICATION, SUSPENDED, DISABLED. */
  async activateUser(agencyId: string, id: string, options?: { currentUserId?: string }) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    const allowed = ["INVITED", "PENDING_VERIFICATION", "SUSPENDED", "DISABLED"] as const;
    if (!allowed.includes(user.status as (typeof allowed)[number])) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "User is already active", 400);
    }
    await userRepo.update(id, agencyId, { status: "ACTIVE", emailVerifiedAt: new Date() });
    const updated = await userRepo.findByIdAndAgency(id, agencyId);
    return toUserPublicDTO(updated!);
  }

  /** Suspend user: set status=SUSPENDED. Only for non-deleted users. */
  async suspendUser(agencyId: string, id: string, options?: { currentUserId?: string }) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if (options?.currentUserId && id === options.currentUserId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You cannot suspend your own account.", 403);
    }
    const roleName = user.roleRef?.name ?? user.role;
    if (roleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin user cannot be suspended", 403);
    }
    if (user.status === "SUSPENDED") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "User is already suspended", 400);
    }
    await userRepo.update(id, agencyId, { status: "SUSPENDED" });
    const updated = await userRepo.findByIdAndAgency(id, agencyId);
    return toUserPublicDTO(updated!);
  }

  /** Disable user: set status=DISABLED. Only for non-deleted users. Enforces last-admin guard. */
  async disableUser(agencyId: string, id: string, options?: { currentUserId?: string }) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if (options?.currentUserId && id === options.currentUserId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You cannot disable your own account.", 403);
    }
    const roleName = user.roleRef?.name ?? user.role;
    if (roleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin user cannot be disabled", 403);
    }
    if (user.status === "DISABLED") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "User is already disabled", 400);
    }
    if (roleName === ROLES.AGENCY_ADMIN) {
      const prisma = getPrismaForInternalUse();
      await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
        const adminCount = await userRepo.countAgencyAdmins(agencyId, tx);
        if (adminCount <= 1) {
          throw new AppError(
            ERROR_CODES.PERMISSION_DENIED,
            "Cannot disable the last agency admin. Assign another admin first.",
            403
          );
        }
        await userRepo.update(id, agencyId, { status: "DISABLED" }, tx);
      });
    } else {
      await userRepo.update(id, agencyId, { status: "DISABLED" });
    }
    const updated = await userRepo.findByIdAndAgency(id, agencyId);
    return toUserPublicDTO(updated!);
  }

  /** Resend invitation email for a user with status INVITED. Keeps status=INVITED. */
  async resendInvite(agencyId: string, id: string) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if (user.status !== "INVITED") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Only invited users can have invitation resent", 400);
    }
    await this.sendInvitationEmail(user);
    return { message: "Invitation resent" };
  }

  /** Set password manually (admin). If user is INVITED or PENDING_VERIFICATION, also sets status=ACTIVE and emailVerifiedAt=now. */
  async setPassword(agencyId: string, id: string, password: string) {
    const user = await userRepo.findByIdAndAgency(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    const passwordHash = await bcrypt.hash(password, 12);
    await userRepo.updatePassword(id, agencyId, passwordHash);
    if (user.status === "INVITED" || user.status === "PENDING_VERIFICATION") {
      await userRepo.update(id, agencyId, { status: "ACTIVE", emailVerifiedAt: new Date() });
    }
    const updated = await userRepo.findByIdAndAgency(id, agencyId);
    return toUserPublicDTO(updated!);
  }

  /** Restore a soft-deleted user. Only sets deletedAt = null and status = ACTIVE; does not change authProvider, providerId, passwordHash. */
  async restoreUser(agencyId: string, id: string) {
    const user = await userRepo.findByIdAndAgencyIncludingDeleted(id, agencyId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if (user.deletedAt == null) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "User is not deleted", 400);
    }
    const restored = await userRepo.restoreUser(id, agencyId);
    if (!restored) throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Restore failed", 500);
    return toUserPublicDTO(restored);
  }
}
