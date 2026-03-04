import { prisma } from "../../lib/prisma.js";
import { AuthService } from "../auth/auth.service.js";
import { ROLES } from "../../constants/roles.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { audit } from "../../lib/audit.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { refresh as refreshSystemConfigCache } from "../../services/SystemConfigCache.js";
import { getUptimeSeconds } from "../../utils/uptime.js";
import { API_VERSION } from "../../config/version.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { SuperadminSystemSettingsRepository } from "./superadmin-system-settings.repository.js";
import type {
  SystemSettingsUpdateInput,
  CreateAgencyInput,
  UpdateAgencyInput,
  UpdateAgencyPlanInput,
  ListUsersQuery,
  SetUserRoleInput,
  CreateUserInput,
} from "./superadmin.validation.js";
import { PAGINATION, clampLimit, clampPage } from "../../constants/pagination.js";
import { UserService } from "../users/user.service.js";
import { RoleRepository } from "../roles/role.repository.js";
import { RolesService } from "../roles/roles.service.js";

const systemSettingsRepo = new SuperadminSystemSettingsRepository(prisma);
const authService = new AuthService();
const userService = new UserService();
const rolesService = new RolesService();
const roleRepo = new RoleRepository(prisma);

export interface SystemSettingsDTO {
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMessage: string | null;
  defaultTheme: string;
  allowAgencyRegistration: boolean;
  maxUsersPerAgency: number | null;
  defaultTimezone: string;
  maintenanceMode: boolean;
}

export interface AgencyEditorDTO {
  id: string;
  name: string;
  email: string;
}

export interface AgencyListItemDTO {
  id: string;
  name: string;
  slug: string;
  status: string;
  planName: string | null;
  planCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: AgencyEditorDTO | null;
  userCount?: number;
}

export interface PlatformUserListItemDTO {
  id: string;
  email: string;
  role: string;
  agencyName: string | null;
  status: string;
  createdAt: Date;
  name?: string | null;
}

export interface PlatformUserDetailDTO extends PlatformUserListItemDTO {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  agencyId: string | null;
  lastLoginAt: Date | null;
  updatedAt: Date;
}

export interface SuperadminAuditEntryDTO {
  id: string;
  action: string;
  actorUserId: string;
  actorEmail: string;
  targetAgencyId: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  impersonation: boolean;
  createdAt: Date;
}

export class SuperadminService {
  async getSystemSettings(): Promise<SystemSettingsDTO> {
    const row = await systemSettingsRepo.getOrCreate();
    return {
      allowRegistration: row.allowRegistration,
      emailVerificationRequired: row.emailVerificationRequired,
      maintenanceMessage: row.maintenanceMessage,
      defaultTheme: row.defaultTheme,
      allowAgencyRegistration: row.allowAgencyRegistration,
      maxUsersPerAgency: row.maxUsersPerAgency,
      defaultTimezone: row.defaultTimezone,
      maintenanceMode: row.maintenanceMode,
    };
  }

  async updateSystemSettings(req: AuthRequest, input: SystemSettingsUpdateInput): Promise<SystemSettingsDTO> {
    const row = await systemSettingsRepo.upsert(input);
    await refreshSystemConfigCache();
    await audit(req, {
      action: "SYSTEM_SETTINGS_UPDATED",
      resource: "system",
      details: input as Record<string, unknown>,
    });
    return {
      allowRegistration: row.allowRegistration,
      emailVerificationRequired: row.emailVerificationRequired,
      maintenanceMessage: row.maintenanceMessage,
      defaultTheme: row.defaultTheme,
      allowAgencyRegistration: row.allowAgencyRegistration,
      maxUsersPerAgency: row.maxUsersPerAgency,
      defaultTimezone: row.defaultTimezone,
      maintenanceMode: row.maintenanceMode,
    };
  }

  async getAgencies(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<{ data: AgencyListItemDTO[]; total: number }> {
    const page = clampPage(params.page ?? PAGINATION.DEFAULT_PAGE);
    const limit = clampLimit(params.limit ?? PAGINATION.DEFAULT_LIMIT);
    const offset = (page - 1) * limit;
    const sortBy = params.sortBy === "name" ? "name" : "createdAt";
    const order = params.order === "asc" ? "asc" : "desc";

    const [agencies, total] = await Promise.all([
      prisma.agency.findMany({
        orderBy: { [sortBy]: order },
        skip: offset,
        take: limit,
        include: {
          _count: { select: { users: true } },
          plan: { select: { name: true, code: true } },
        },
      }),
      prisma.agency.count(),
    ]);

    const data: AgencyListItemDTO[] = agencies.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      status: a.status,
      planName: a.plan?.name ?? null,
      planCode: a.plan?.code ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      updatedBy: null,
      userCount: a._count.users,
    }));
    return { data, total };
  }

  async getAgencyById(agencyId: string): Promise<AgencyListItemDTO | null> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
    if (!agency) return null;
    let updatedBy: AgencyEditorDTO | null = null;
    if (agency.updatedById) {
      const user = await prisma.user.findUnique({
        where: { id: agency.updatedById },
        select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
      });
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      status: agency.status,
      planName: agency.plan?.name ?? null,
      planCode: agency.plan?.code ?? null,
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
      updatedBy,
      userCount: agency._count.users,
    };
  }

  async createAgency(req: AuthRequest, input: CreateAgencyInput): Promise<AgencyListItemDTO> {
    const existingSlug = await prisma.agency.findUnique({ where: { slug: input.slug } });
    if (existingSlug) {
      throw new AppError(ERROR_CODES.AGENCY_ALREADY_EXISTS, "Agency with this slug already exists", 409);
    }
    const existingEmail = await prisma.user.findUnique({ where: { email: input.adminEmail.toLowerCase() } });
    if (existingEmail) {
      throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists", 409);
    }
    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
    if (!plan.isActive) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Plan is not active", 403);

    const passwordHash = await bcrypt.hash(input.adminPassword, 12);
    const agency = await prisma.agency.create({
      data: {
        name: input.name,
        slug: input.slug,
        planId: input.planId,
        onboardingCompleted: true,
      },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
    const { roleAgencyAdminId } = await rolesService.ensureAgencyRoles(agency.id);
    await prisma.user.create({
      data: {
        email: input.adminEmail.toLowerCase(),
        passwordHash,
        displayName: input.adminName ?? null,
        roleId: roleAgencyAdminId,
        status: "ACTIVE",
        agencyId: agency.id,
      },
    });

    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: agency.id,
      details: { action: "AGENCY_CREATE", agencyName: agency.name, adminEmail: input.adminEmail },
    });

    return {
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      status: agency.status,
      planName: agency.plan?.name ?? null,
      planCode: agency.plan?.code ?? null,
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
      updatedBy: null,
      userCount: agency._count.users,
    };
  }

  async updateAgency(req: AuthRequest, agencyId: string, input: UpdateAgencyInput): Promise<AgencyListItemDTO> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: { _count: { select: { users: true } }, plan: { select: { name: true } } },
    });
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);

    if (input.planId !== undefined && input.planId !== null) {
      const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
      if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
      if (!plan.isActive) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Plan is not active", 403);
    }

    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.planId !== undefined && { planId: input.planId }),
        ...(input.status !== undefined && { status: input.status }),
        updatedById: req.user!.userId,
      },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });

    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: agencyId,
      details: { action: "AGENCY_UPDATE", agencyName: updated.name, input: input as Record<string, unknown> },
    });

    let updatedBy: AgencyEditorDTO | null = null;
    if (updated.updatedById) {
      const user = await prisma.user.findUnique({
        where: { id: updated.updatedById },
        select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
      });
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      planName: updated.plan?.name ?? null,
      planCode: updated.plan?.code ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      updatedBy,
      userCount: updated._count.users,
    };
  }

  async updateAgencyPlan(req: AuthRequest, agencyId: string, input: UpdateAgencyPlanInput): Promise<AgencyListItemDTO> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
    if (!plan.isActive) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Plan is not active", 403);
    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: { planId: input.planId, updatedById: req.user!.userId },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: agencyId,
      details: { action: "AGENCY_PLAN_CHANGE", planId: input.planId, planCode: plan.code },
    });
    let updatedBy: AgencyEditorDTO | null = null;
    if (updated.updatedById) {
      const user = await prisma.user.findUnique({
        where: { id: updated.updatedById },
        select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
      });
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      planName: updated.plan?.name ?? null,
      planCode: updated.plan?.code ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      updatedBy,
      userCount: updated._count.users,
    };
  }

  async deleteAgency(req: AuthRequest, agencyId: string): Promise<AgencyListItemDTO> {
    return this.updateAgencyStatus(req, agencyId, "DELETED");
  }

  async suspendAgency(req: AuthRequest, agencyId: string): Promise<AgencyListItemDTO> {
    const out = await this.updateAgencyStatus(req, agencyId, "SUSPENDED");
    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: agencyId,
      details: { action: "AGENCY_SUSPEND" },
    });
    return out;
  }

  async activateAgency(req: AuthRequest, agencyId: string): Promise<AgencyListItemDTO> {
    return this.updateAgencyStatus(req, agencyId, "ACTIVE");
  }

  async updateAgencyStatus(
    req: AuthRequest,
    agencyId: string,
    status: "ACTIVE" | "DISABLED" | "SUSPENDED" | "DELETED"
  ): Promise<AgencyListItemDTO> {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
    if (!agency) {
      throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    }
    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: { status, updatedById: req.user!.userId },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
    await audit(req, {
      action: "AGENCY_STATUS_UPDATED",
      resource: "agency",
      resourceId: agencyId,
      details: { previousStatus: agency.status, newStatus: status, agencyName: agency.name },
    });
    let updatedBy: AgencyEditorDTO | null = null;
    if (updated.updatedById) {
      const user = await prisma.user.findUnique({
        where: { id: updated.updatedById },
        select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
      });
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      planName: updated.plan?.name ?? null,
      planCode: updated.plan?.code ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      updatedBy,
      userCount: updated._count.users,
    };
  }

  async impersonate(req: AuthRequest, agencyId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    }
    if (agency.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot impersonate a disabled agency", 403);
    }
    const userId = req.user!.userId;
    const accessToken = authService.createAccessTokenForVerify({
      userId,
      agencyId,
      role: ROLES.SUPER_ADMIN,
      impersonation: true,
    });
    await audit(req, {
      action: "IMPERSONATION_START",
      resource: "impersonation",
      resourceId: agencyId,
      details: {
        actorUserId: userId,
        actorRole: ROLES.SUPER_ADMIN,
        effectiveAgencyId: agencyId,
        impersonation: true,
        agencyName: agency.name,
        agencySlug: agency.slug,
      },
      impersonation: true,
    });
    return { accessToken, expiresIn: 900 };
  }

  async stopImpersonation(req: AuthRequest): Promise<{ accessToken: string; expiresIn: number }> {
    const userId = req.user!.userId;
    const effectiveAgencyId = req.user!.agencyId; // agency being left (impersonation context)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { agencyId: true },
    });
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    }
    const accessToken = authService.createAccessTokenForVerify({
      userId,
      agencyId: user.agencyId,
      role: ROLES.SUPER_ADMIN,
    });
    await audit(req, {
      action: "IMPERSONATION_END",
      resource: "impersonation",
      details: {
        actorUserId: userId,
        actorRole: ROLES.SUPER_ADMIN,
        effectiveAgencyId, // agency they were impersonating (left)
        impersonation: true,
      },
      impersonation: true,
    });
    return { accessToken, expiresIn: 900 };
  }

  async getMetrics(): Promise<{
    agenciesCount: number;
    usersCount: number;
    activeSessions: number;
    uptime: number;
  }> {
    const [agenciesCount, usersCount, activeSessions] = await Promise.all([
      prisma.agency.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    ]);
    return {
      agenciesCount,
      usersCount,
      activeSessions,
      uptime: getUptimeSeconds(),
    };
  }

  async getHealth(): Promise<{
    databaseStatus: "ok" | "error";
    uptime: number;
    version: string;
    memoryUsage: { heapUsed: number; heapTotal: number; rss: number };
  }> {
    let databaseStatus: "ok" | "error" = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseStatus = "error";
    }
    const mem = process.memoryUsage();
    return {
      databaseStatus,
      uptime: getUptimeSeconds(),
      version: API_VERSION,
      memoryUsage: { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss },
    };
  }

  async getUsers(query: ListUsersQuery): Promise<{ data: PlatformUserListItemDTO[]; total: number }> {
    const page = clampPage(query.page ?? PAGINATION.DEFAULT_PAGE);
    const limit = clampLimit(query.limit ?? PAGINATION.DEFAULT_LIMIT);
    const offset = (page - 1) * limit;
    const sortBy = query.sortBy ?? "createdAt";
    const order = query.order === "asc" ? "asc" : "desc";

    const where = { deletedAt: null };
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      (where as Record<string, unknown>).OR = [
        { email: { contains: term, mode: "insensitive" as const } },
        { displayName: { contains: term, mode: "insensitive" as const } },
        { firstName: { contains: term, mode: "insensitive" as const } },
        { lastName: { contains: term, mode: "insensitive" as const } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: offset,
        take: limit,
        include: { agency: { select: { name: true } }, roleRef: { select: { name: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    const data: PlatformUserListItemDTO[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.roleRef?.name ?? u.role ?? "USER",
      agencyName: u.agency?.name ?? null,
      status: u.status,
      createdAt: u.createdAt,
      name: u.displayName ?? (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null),
    }));
    return { data, total };
  }

  async createUser(req: AuthRequest, input: CreateUserInput): Promise<PlatformUserListItemDTO> {
    const agency = await prisma.agency.findUnique({
      where: { id: input.agencyId },
      select: { id: true, name: true, status: true },
    });
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    if (agency.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot add user to a non-active agency", 403);
    }

    const created = await userService.create(input.agencyId, {
      email: input.email,
      password: input.password,
      role: input.role,
      name: input.name ?? null,
      invite: false,
    });

    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "user",
      targetUserId: created.id,
      details: { action: "USER_CREATE", email: created.email, agencyId: input.agencyId, role: input.role },
    });

    return {
      id: created.id,
      email: created.email,
      role: created.role,
      agencyName: created.agency?.name ?? agency.name,
      status: created.status,
      createdAt: created.createdAt,
      name: created.name ?? null,
    };
  }

  async getUserById(userId: string): Promise<PlatformUserDetailDTO | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { agency: { select: { id: true, name: true } }, roleRef: { select: { id: true, name: true } } },
    });
    if (!user) return null;
    const role = user.roleRef?.name ?? user.role ?? "USER";
    return {
      id: user.id,
      email: user.email,
      role,
      agencyName: user.agency?.name ?? null,
      agencyId: user.agencyId,
      status: user.status,
      createdAt: user.createdAt,
      name: user.displayName ?? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null),
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      lastLoginAt: user.lastLoginAt,
      updatedAt: user.updatedAt,
    };
  }

  async disableUser(req: AuthRequest, userId: string): Promise<PlatformUserDetailDTO> {
    if (userId === req.user!.userId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You cannot disable your own account", 403);
    }
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { agency: { select: { name: true } }, roleRef: { select: { name: true } } } });
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin cannot be disabled", 403);
    }
    await prisma.user.update({ where: { id: userId }, data: { status: "DISABLED" } });
    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "user",
      resourceId: userId,
      targetUserId: userId,
      details: { action: "USER_DISABLE", email: user.email },
    });
    const updated = await this.getUserById(userId);
    return updated!;
  }

  async enableUser(req: AuthRequest, userId: string): Promise<PlatformUserDetailDTO> {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { roleRef: { select: { name: true } } } });
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin cannot be modified", 403);
    }
    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
    const updated = await this.getUserById(userId);
    return updated!;
  }

  async setUserRole(req: AuthRequest, userId: string, input: SetUserRoleInput): Promise<PlatformUserDetailDTO> {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { roleRef: { select: { name: true } } } });
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin role cannot be changed", 403);
    }
    if (user.agencyId == null) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Only agency users can have role changed", 403);
    }
    const role = await roleRepo.findRoleByNameAndAgency(user.agencyId, input.role);
    if (!role) throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Role ${input.role} not found for this agency.`, 500);
    await prisma.user.update({ where: { id: userId }, data: { roleId: role.id } });
    const updated = await this.getUserById(userId);
    return updated!;
  }

  async resetUserPassword(req: AuthRequest, userId: string): Promise<{ temporaryPassword: string }> {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { roleRef: { select: { name: true } } } });
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin password cannot be reset via this API", 403);
    }
    const temporaryPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "user",
      resourceId: userId,
      targetUserId: userId,
      details: { action: "USER_RESET_PASSWORD", email: user.email },
    });
    return { temporaryPassword };
  }

  async getAuditLogs(options: { page: number; limit: number; offset: number }): Promise<{
    data: SuperadminAuditEntryDTO[];
    total: number;
  }> {
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: options.offset,
        take: options.limit,
        include: { user: { select: { email: true } } },
      }),
      prisma.auditLog.count(),
    ]);
    const data: SuperadminAuditEntryDTO[] = rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorUserId: r.userId,
      actorEmail: r.user.email,
      targetAgencyId: r.agencyId,
      targetUserId: r.targetUserId,
      metadata: r.details as Record<string, unknown> | null,
      impersonation: r.impersonation,
      createdAt: r.createdAt,
    }));
    return { data, total };
  }
}
