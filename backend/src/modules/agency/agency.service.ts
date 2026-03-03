import { ROLES } from "../../constants/roles.js";
import { prisma } from "../../lib/prisma.js";
import { BaseService } from "../../core/BaseService.js";
import { AgencyRepository } from "./agency.repository.js";
import { RoleRepository } from "../roles/role.repository.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { get as getSystemConfig } from "../../services/SystemConfigCache.js";
import { getPlanByCodeCached, getPlansCached } from "../../services/PlanCache.js";
import type { CreateAgencyInput } from "./agency.validation.js";

const agencyRepo = new AgencyRepository(prisma);
const roleRepo = new RoleRepository(prisma);

export class AgencyService extends BaseService {
  async create(input: CreateAgencyInput, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, roleRef: { select: { name: true } } },
    });
    const roleName = user?.roleRef?.name ?? user?.role;
    if (roleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Super admin cannot create an agency", 403);
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
    const roleAgencyAdmin = await roleRepo.findSystemRoleByName(ROLES.AGENCY_ADMIN);
    if (!roleAgencyAdmin) throw new AppError(ERROR_CODES.INTERNAL_ERROR, "System role AGENCY_ADMIN not found. Run seed.", 500);
    const agency = await agencyRepo.create({ ...input, planId });
    await prisma.user.update({
      where: { id: userId },
      data: { agencyId: agency.id, roleId: roleAgencyAdmin.id },
    });
    await agencyRepo.setOnboardingCompleted(agency.id);
    return agency;
  }

  async getById(id: string) {
    const agency = await agencyRepo.findById(id);
    if (!agency) {
      throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    }
    return agency;
  }

  async list() {
    return agencyRepo.list();
  }
}
