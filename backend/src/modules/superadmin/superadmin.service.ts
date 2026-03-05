import type { Prisma } from "@prisma/client";
import {
  agencyRepository,
  userRepository,
  plansRepository,
  auditLogRepository,
  roleRepository as roleRepo,
  superadminSystemSettingsRepository as systemSettingsRepo,
  authRepository,
  getPrismaForInternalUse,
} from "../../lib/data-access.js";
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
import { RolesService } from "../roles/roles.service.js";

const authService = new AuthService();
const userService = new UserService();
const rolesService = new RolesService();

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

/** ssoConfig for API response: never include clientSecret. */
export type SsoConfigPublic = {
  issuer?: string;
  clientId?: string;
  scope?: string;
  allowedEmailDomains?: string[];
};

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
  ssoEnabled?: boolean;
  ssoEnforced?: boolean;
  ssoProvider?: string | null;
  ssoConfig?: SsoConfigPublic | null;
}

function sanitizeSsoConfig(raw: unknown): SsoConfigPublic | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: SsoConfigPublic = {};
  if (typeof o.issuer === "string") out.issuer = o.issuer;
  if (typeof o.clientId === "string") out.clientId = o.clientId;
  if (typeof o.scope === "string") out.scope = o.scope;
  if (Array.isArray(o.allowedEmailDomains)) out.allowedEmailDomains = o.allowedEmailDomains.filter((x) => typeof x === "string");
  return Object.keys(out).length ? out : null;
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
    search?: string;
  }): Promise<{ data: AgencyListItemDTO[]; total: number }> {
    const page = clampPage(params.page ?? PAGINATION.DEFAULT_PAGE);
    const limit = clampLimit(params.limit ?? PAGINATION.DEFAULT_LIMIT);
    const offset = (page - 1) * limit;
    const allowedAgencySort = ["name", "slug", "status", "createdAt", "updatedAt"] as const;
    const sortBy = params.sortBy && allowedAgencySort.includes(params.sortBy as (typeof allowedAgencySort)[number])
      ? params.sortBy
      : "createdAt";
    const order = params.order === "asc" ? "asc" : "desc";

    const searchWhere =
      params.search?.trim()
        ? {
            OR: [
              { name: { contains: params.search.trim(), mode: "insensitive" as const } },
              { slug: { contains: params.search.trim(), mode: "insensitive" as const } },
            ],
          }
        : undefined;

    const [agencies, total] = await Promise.all([
      agencyRepository.listWithPlanAndCount({ [sortBy]: order }, offset, limit, searchWhere),
      agencyRepository.countAll(searchWhere),
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
      ssoEnabled: a.ssoEnabled ?? false,
      ssoEnforced: (a as { ssoEnforced?: boolean }).ssoEnforced ?? false,
      ssoProvider: a.ssoProvider ?? null,
      ssoConfig: sanitizeSsoConfig(a.ssoConfig),
    }));
    return { data, total };
  }

  async getAgencyById(agencyId: string): Promise<AgencyListItemDTO | null> {
    const agency = await agencyRepository.findByIdWithPlanAndCount(agencyId);
    if (!agency) return null;
    let updatedBy: AgencyEditorDTO | null = null;
    if (agency.updatedById) {
      const user = await userRepository.findUserDisplayById(agency.updatedById);
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
      ssoEnabled: agency.ssoEnabled ?? false,
      ssoEnforced: (agency as { ssoEnforced?: boolean }).ssoEnforced ?? false,
      ssoProvider: agency.ssoProvider ?? null,
      ssoConfig: sanitizeSsoConfig(agency.ssoConfig),
    };
  }

  async createAgency(req: AuthRequest, input: CreateAgencyInput): Promise<AgencyListItemDTO> {
    const existingSlug = await agencyRepository.findBySlug(input.slug);
    if (existingSlug) {
      throw new AppError(ERROR_CODES.AGENCY_ALREADY_EXISTS, "Agency with this slug already exists", 409);
    }
    const existingEmail = await authRepository.findByEmail(input.adminEmail.toLowerCase());
    if (existingEmail) {
      throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists", 409);
    }
    const plan = await plansRepository.findById(input.planId);
    if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
    if (!plan.isActive) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Plan is not active", 403);

    const passwordHash = await bcrypt.hash(input.adminPassword, 12);
    const created = await agencyRepository.create({
      name: input.name,
      slug: input.slug,
      planId: input.planId,
      onboardingCompleted: true,
    });
    const { roleAgencyAdminId } = await rolesService.ensureAgencyRoles(created.id);
    await userRepository.create({
      email: input.adminEmail.toLowerCase(),
      passwordHash,
      displayName: input.adminName ?? null,
      roleId: roleAgencyAdminId,
      status: "ACTIVE",
      agencyId: created.id,
    });

    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: created.id,
      details: { action: "AGENCY_CREATE", agencyName: created.name, adminEmail: input.adminEmail },
    });

    const agency = await agencyRepository.findByIdWithPlanAndCount(created.id);
    return {
      id: agency!.id,
      name: agency!.name,
      slug: agency!.slug,
      status: agency!.status,
      planName: agency!.plan?.name ?? null,
      planCode: agency!.plan?.code ?? null,
      createdAt: agency!.createdAt,
      updatedAt: agency!.updatedAt,
      updatedBy: null,
      userCount: agency!._count.users,
    };
  }

  async updateAgency(req: AuthRequest, agencyId: string, input: UpdateAgencyInput): Promise<AgencyListItemDTO> {
    const agency = await agencyRepository.findByIdWithPlanAndCount(agencyId);
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);

    if (input.planId !== undefined && input.planId !== null) {
      const plan = await plansRepository.findById(input.planId);
      if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
      if (!plan.isActive) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Plan is not active", 403);
    }

    let ssoProvider: string | null | undefined;
    let ssoConfig: unknown;
    if (input.ssoEnabled === false) {
      ssoProvider = null;
      ssoConfig = null;
    } else if (input.ssoEnabled === true && input.ssoConfig != null) {
      const cfg = input.ssoConfig as { issuer?: string; clientId?: string; clientSecret?: string; scope?: string; allowedEmailDomains?: string[] };
      if (!cfg.issuer?.trim() || !cfg.clientId?.trim()) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, "When SSO is enabled, issuer and clientId are required", 400);
      }
      const existing = (agency.ssoConfig as { clientSecret?: string } | null) ?? {};
      const clientSecret = cfg.clientSecret?.trim() ? cfg.clientSecret.trim() : existing.clientSecret;
      if (!clientSecret) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, "When SSO is enabled, clientSecret is required (leave blank to keep existing)", 400);
      }
      ssoProvider = input.ssoProvider ?? "oidc";
      ssoConfig = {
        issuer: cfg.issuer.trim(),
        clientId: cfg.clientId.trim(),
        clientSecret,
        scope: cfg.scope?.trim() || "openid email profile",
        allowedEmailDomains: Array.isArray(cfg.allowedEmailDomains) ? cfg.allowedEmailDomains.filter((d) => typeof d === "string" && d.trim()) : undefined,
      };
    } else {
      ssoProvider = undefined;
      ssoConfig = undefined;
    }

    await agencyRepository.updatePartial(agencyId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.planId !== undefined && { planId: input.planId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.ssoEnabled !== undefined && { ssoEnabled: input.ssoEnabled }),
      ...(input.ssoEnforced !== undefined && { ssoEnforced: input.ssoEnforced }),
      ...(ssoProvider !== undefined && { ssoProvider }),
      ...(ssoConfig !== undefined && { ssoConfig }),
      updatedById: req.user!.userId,
    });
    const updated = await agencyRepository.findByIdWithPlanAndCount(agencyId);

    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: agencyId,
      details: { action: "AGENCY_UPDATE", agencyName: updated!.name, input: input as Record<string, unknown> },
    });

    let updatedBy: AgencyEditorDTO | null = null;
    if (updated!.updatedById) {
      const user = await userRepository.findUserDisplayById(updated!.updatedById);
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: updated!.id,
      name: updated!.name,
      slug: updated!.slug,
      status: updated!.status,
      planName: updated!.plan?.name ?? null,
      planCode: updated!.plan?.code ?? null,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
      updatedBy,
      userCount: updated!._count.users,
      ssoEnabled: updated!.ssoEnabled ?? false,
      ssoEnforced: (updated as { ssoEnforced?: boolean }).ssoEnforced ?? false,
      ssoProvider: updated!.ssoProvider ?? null,
      ssoConfig: sanitizeSsoConfig(updated!.ssoConfig),
    };
  }

  async updateAgencyPlan(req: AuthRequest, agencyId: string, input: UpdateAgencyPlanInput): Promise<AgencyListItemDTO> {
    const agency = await agencyRepository.findByIdWithPlanAndCount(agencyId);
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    const plan = await plansRepository.findById(input.planId);
    if (!plan) throw new AppError(ERROR_CODES.PLAN_NOT_FOUND, "Plan not found", 404);
    if (!plan.isActive) throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Plan is not active", 403);
    await agencyRepository.updatePartial(agencyId, { planId: input.planId, updatedById: req.user!.userId });
    const updated = await agencyRepository.findByIdWithPlanAndCount(agencyId);
    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "agency",
      resourceId: agencyId,
      details: { action: "AGENCY_PLAN_CHANGE", planId: input.planId, planCode: plan.code },
    });
    let updatedBy: AgencyEditorDTO | null = null;
    if (updated!.updatedById) {
      const user = await userRepository.findUserDisplayById(updated!.updatedById);
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: updated!.id,
      name: updated!.name,
      slug: updated!.slug,
      status: updated!.status,
      planName: updated!.plan?.name ?? null,
      planCode: updated!.plan?.code ?? null,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
      updatedBy,
      userCount: updated!._count.users,
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
    const agency = await agencyRepository.findByIdWithPlanAndCount(agencyId);
    if (!agency) {
      throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    }
    await agencyRepository.updatePartial(agencyId, { status, updatedById: req.user!.userId });
    const updated = await agencyRepository.findByIdWithPlanAndCount(agencyId);
    await audit(req, {
      action: "AGENCY_STATUS_UPDATED",
      resource: "agency",
      resourceId: agencyId,
      details: { previousStatus: agency.status, newStatus: status, agencyName: agency.name },
    });
    let updatedBy: AgencyEditorDTO | null = null;
    if (updated!.updatedById) {
      const user = await userRepository.findUserDisplayById(updated!.updatedById);
      if (user) {
        const name =
          user.displayName?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.email;
        updatedBy = { id: user.id, name, email: user.email };
      }
    }
    return {
      id: updated!.id,
      name: updated!.name,
      slug: updated!.slug,
      status: updated!.status,
      planName: updated!.plan?.name ?? null,
      planCode: updated!.plan?.code ?? null,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
      updatedBy,
      userCount: updated!._count.users,
    };
  }

  async impersonate(req: AuthRequest, agencyId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const agency = await agencyRepository.findById(agencyId);
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
    const user = await userRepository.findByIdForPlatform(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    }
    const accessToken = authService.createAccessTokenForVerify({
      userId,
      agencyId: user.agencyId ?? null,
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
    // Platform scope: counts across all tenants; no agencyId filter.
    const [agenciesCount, usersCount, activeSessions] = await Promise.all([
      agencyRepository.countAll(),
      userRepository.countAllActive(),
      getPrismaForInternalUse().session.count({ where: { expiresAt: { gt: new Date() } } }),
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
    const { checkDatabase } = await import("../../lib/data-access.js");
    const databaseStatus = (await checkDatabase()) ? "ok" : "error";
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
    const order = query.order === "asc" ? "asc" : "desc";
    const allowedSort: Array<"createdAt" | "email" | "role" | "status"> = ["createdAt", "email", "role", "status"];
    const sortBy = query.sortBy && allowedSort.includes(query.sortBy) ? query.sortBy : "createdAt";
    const orderBy =
      sortBy === "role"
        ? ({ roleRef: { name: order } } as const)
        : ({ [sortBy]: order } as { createdAt?: "asc" | "desc"; email?: "asc" | "desc"; status?: "asc" | "desc" });

    // Platform scope only: agencyId is optional filter when provided by superadmin; never used for tenant isolation.
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (query.agencyId?.trim()) {
      where.agencyId = query.agencyId.trim();
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      where.OR = [
        { email: { contains: term, mode: "insensitive" } },
        { displayName: { contains: term, mode: "insensitive" } },
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
      ];
    }

    const { rows: users, total } = await userRepository.listAllForPlatform({
      where,
      orderBy,
      skip: offset,
      take: limit,
    });

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
    const agency = await agencyRepository.findById(input.agencyId);
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
    const user = await userRepository.findByIdForPlatform(userId);
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
    const user = await userRepository.findByIdForPlatform(userId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin cannot be disabled", 403);
    }
    await userRepository.updateByUserIdPlatform(userId, { status: "DISABLED" });
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
    const user = await userRepository.findByIdForPlatform(userId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin cannot be modified", 403);
    }
    await userRepository.updateByUserIdPlatform(userId, { status: "ACTIVE" });
    const updated = await this.getUserById(userId);
    return updated!;
  }

  async setUserRole(req: AuthRequest, userId: string, input: SetUserRoleInput): Promise<PlatformUserDetailDTO> {
    const user = await userRepository.findByIdForPlatform(userId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin role cannot be changed", 403);
    }
    if (user.agencyId == null) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Only agency users can have role changed", 403);
    }
    const role = await roleRepo.findRoleByNameAndAgency(user.agencyId, input.role);
    if (!role) throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Role ${input.role} not found for this agency.`, 500);
    await userRepository.updateByUserIdPlatform(userId, { roleId: role.id });
    const updated = await this.getUserById(userId);
    return updated!;
  }

  async resetUserPassword(req: AuthRequest, userId: string): Promise<{ temporaryPassword: string }> {
    const user = await userRepository.findByIdForPlatform(userId);
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if ((user.roleRef?.name ?? user.role) === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin password cannot be reset via this API", 403);
    }
    const temporaryPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await userRepository.updateByUserIdPlatform(userId, { passwordHash });
    await audit(req, {
      action: "SUPERADMIN_ACTION",
      resource: "user",
      resourceId: userId,
      targetUserId: userId,
      details: { action: "USER_RESET_PASSWORD", email: user.email },
    });
    return { temporaryPassword };
  }

  async getAuditLogs(options: {
    page: number;
    limit: number;
    offset: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: SuperadminAuditEntryDTO[];
    total: number;
  }> {
    const { rows, total } = await auditLogRepository.listAllPlatform({
      offset: options.offset,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    });
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
