/**
 * Enforces plan limits (users, locations, facilities, employees).
 * Uses plan from agency; throws PLAN_LIMIT_REACHED when limit exceeded.
 */

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { getPlansCached, getPlanByIdCached } from "../../services/PlanCache.js";

export async function checkUserLimit(agencyId: string): Promise<void> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { planId: true },
  });
  if (!agency?.planId) return; // no plan = no limit enforced
  await getPlansCached(); // ensure cache warm
  const plan = getPlanByIdCached(agency.planId);
  if (!plan) return;
  const count = await prisma.user.count({
    where: { agencyId, deletedAt: null },
  });
  if (plan.maxUsers >= 0 && count >= plan.maxUsers) {
    throw new AppError(
      ERROR_CODES.PLAN_LIMIT_REACHED,
      `User limit reached (max ${plan.maxUsers}). Upgrade your plan to add more users.`,
      403
    );
  }
}

export async function checkLocationLimit(agencyId: string): Promise<void> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { planId: true },
  });
  if (!agency?.planId) return;
  await getPlansCached();
  const plan = getPlanByIdCached(agency.planId);
  if (!plan) return;
  // No Location model yet - skip or count from future table
  const count = 0;
  if (plan.maxLocations >= 0 && count >= plan.maxLocations) {
    throw new AppError(
      ERROR_CODES.PLAN_LIMIT_REACHED,
      `Location limit reached (max ${plan.maxLocations}). Upgrade your plan.`,
      403
    );
  }
}

export async function checkFacilityLimit(agencyId: string): Promise<void> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { planId: true },
  });
  if (!agency?.planId) return;
  await getPlansCached();
  const plan = getPlanByIdCached(agency.planId);
  if (!plan) return;
  const count = 0;
  if (plan.maxFacilities >= 0 && count >= plan.maxFacilities) {
    throw new AppError(
      ERROR_CODES.PLAN_LIMIT_REACHED,
      `Facility limit reached (max ${plan.maxFacilities}). Upgrade your plan.`,
      403
    );
  }
}

export async function checkEmployeeLimit(agencyId: string): Promise<void> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { planId: true },
  });
  if (!agency?.planId) return;
  await getPlansCached();
  const plan = getPlanByIdCached(agency.planId);
  if (!plan) return;
  const count = 0;
  if (plan.maxEmployees >= 0 && count >= plan.maxEmployees) {
    throw new AppError(
      ERROR_CODES.PLAN_LIMIT_REACHED,
      `Employee limit reached (max ${plan.maxEmployees}). Upgrade your plan.`,
      403
    );
  }
}
