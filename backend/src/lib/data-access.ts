/**
 * Single entry point for data access. All tenant-scoped and platform-scoped reads/writes
 * go through these repositories. This prevents unscoped Prisma calls (e.g. prisma.user.findMany())
 * outside repositories, which would be a tenant boundary breach.
 *
 * Rule: Application code (services, controllers) must NOT import prisma from lib/prisma.
 * Use these repository instances instead. Only repositories and this module use the Prisma client.
 */

import { prisma } from "./prisma.js";
import { UserRepository } from "../modules/users/user.repository.js";
import { AuthRepository } from "../modules/auth/auth.repository.js";
import { RoleRepository } from "../modules/roles/role.repository.js";
import { AgencyRepository } from "../modules/agency/agency.repository.js";
import { SettingsRepository } from "../modules/settings/settings.repository.js";
import { PlansRepository } from "../modules/plans/plans.repository.js";
import { AuditLogRepository } from "../modules/audit-logs/audit-log.repository.js";
import { ApiKeyRepository } from "../modules/api-keys/api-key.repository.js";
import { SystemSettingsRepository } from "../modules/platform/system-settings.repository.js";
import { SuperadminSystemSettingsRepository } from "../modules/superadmin/superadmin-system-settings.repository.js";

export const userRepository = new UserRepository(prisma);
export const authRepository = new AuthRepository(prisma);
export const apiKeyRepository = new ApiKeyRepository(prisma);
export const roleRepository = new RoleRepository(prisma);
export const agencyRepository = new AgencyRepository(prisma);
export const settingsRepository = new SettingsRepository(prisma);
export const plansRepository = new PlansRepository(prisma);
export const auditLogRepository = new AuditLogRepository(prisma);
export const systemSettingsRepository = new SystemSettingsRepository(prisma);
export const superadminSystemSettingsRepository = new SuperadminSystemSettingsRepository(prisma);

/**
 * Only for: caches (RolePermissionCache, PlanCache, SystemConfigCache), seed scripts, and
 * low-level DB checks. Do NOT use for tenant-scoped or platform-scoped application queries;
 * use the repository instances above instead.
 */
export function getPrismaForInternalUse() {
  return prisma;
}

/** For health checks; avoids exposing prisma to health routes. */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
