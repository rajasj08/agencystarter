import { ROLES } from "../../constants/roles.js";
import { prisma } from "../../lib/prisma.js";
import { BaseService } from "../../core/BaseService.js";
import { AgencyRepository } from "./agency.repository.js";
import { RolesService } from "../roles/roles.service.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { get as getSystemConfig } from "../../services/SystemConfigCache.js";
import { getPlanByCodeCached, getPlansCached } from "../../services/PlanCache.js";
import type { CreateAgencyInput } from "./agency.validation.js";

const agencyRepo = new AgencyRepository(prisma);
const rolesService = new RolesService();

export class AgencyService extends BaseService {
  async create(input: CreateAgencyInput, userId: string, callerRole?: string | null) {
    if (callerRole === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin cannot create an agency via onboarding", 403);
    }
    const config = getSystemConfig();
    if (!config.allowAgencyRegistration) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Agency registration is currently disabled", 403);
    }
    const existing = await agencyRepo.findBySlug(input.slug);
    if (existing) {
      throw new AppError(ERROR_CODES.AGENCY_ALREADY_EXISTS, "Agency with this slug already exists", 409);
    }
    await getPlansCached();
    const freePlan = getPlanByCodeCached("FREE");
    const planId = freePlan?.id ?? null;
    const agency = await agencyRepo.create({ ...input, planId });
    const { roleAgencyAdminId } = await rolesService.ensureAgencyRoles(agency.id);
    await prisma.user.update({
      where: { id: userId },
      data: { agencyId: agency.id, roleId: roleAgencyAdminId },
    });
    await agencyRepo.setOnboardingCompleted(agency.id);
    return agency;
  }

  async getById(id: string, callerAgencyId?: string | null, callerRole?: string | null) {
    if (callerRole !== ROLES.SUPER_ADMIN && callerAgencyId != null && id !== callerAgencyId) {
      throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    }
    const agency = await agencyRepo.findById(id);
    if (!agency) {
      throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    }
    return agency;
  }

  async list() {
    return agencyRepo.list();
  }

  /** Tenant-level update: only allowed fields (name, logo, contact, etc.). */
  async updateTenant(agencyId: string, callerAgencyId: string, input: Record<string, unknown>) {
    if (agencyId !== callerAgencyId) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "You can only update your own agency", 403);
    }
    const { AGENCY_TENANT_UPDATE_FIELDS } = await import("../../constants/permissions.js");
    const allowed = new Set(AGENCY_TENANT_UPDATE_FIELDS);
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (allowed.has(key as (typeof AGENCY_TENANT_UPDATE_FIELDS)[number])) {
        data[key] = value === "" ? null : value;
      }
    }
    if (Object.keys(data).length === 0) return agencyRepo.findById(agencyId)!;
    await agencyRepo.updatePartial(agencyId, data);
    return agencyRepo.findById(agencyId)!;
  }
}
