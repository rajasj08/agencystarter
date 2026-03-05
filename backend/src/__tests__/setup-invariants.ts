/**
 * Test data for security invariant tests.
 * Uses getPrismaForInternalUse (allowed for test/seed). Run after DB is migrated and seeded.
 */

import "dotenv/config";
import { getPrismaForInternalUse } from "../lib/data-access.js";
import bcrypt from "bcryptjs";

const prisma = getPrismaForInternalUse();

export const INVARIANT_SEED = {
  AGENCY_B_SLUG: "invariant-tenant-b",
  USER_B_EMAIL: "invariant-user-b@test.local",
  AGENCY_IP_SLUG: "invariant-ip-guard",
  USER_IP_EMAIL: "invariant-ip-user@test.local",
} as const;

const PASSWORD = "InvariantTest1!";

export interface InvariantFixtures {
  apiPrefix: string;
  agencyAId: string;
  agencyBId: string;
  userAEmail: string;
  userBEmail: string;
  userAId: string;
  userBId: string;
  superadminEmail: string;
  superadminId: string;
  agencyIpId: string;
  userIpId: string;
}

async function ensureAgencyBRoles(agencyId: string): Promise<{ roleUserId: string }> {
  let role = await prisma.role.findFirst({
    where: { agencyId, name: "USER" },
    select: { id: true },
  });
  if (role) return { roleUserId: role.id };
  const perm = await prisma.permission.findFirst({ where: { key: "user:read" }, select: { id: true } });
  role = await prisma.role.create({
    data: { name: "USER", agencyId, isSystem: true, isEditable: false, isDeletable: false, isAssignable: true },
    select: { id: true },
  });
  if (perm) {
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: perm.id } });
  }
  return { roleUserId: role.id };
}

async function ensureAgencyIpRoles(agencyId: string): Promise<{ roleAdminId: string }> {
  let role = await prisma.role.findFirst({
    where: { agencyId, name: "AGENCY_ADMIN" },
    select: { id: true },
  });
  if (role) return { roleAdminId: role.id };
  const perms = await prisma.permission.findMany({
    where: { key: { in: ["user:read", "user:list", "settings:read", "settings:update"] } },
    select: { id: true },
  });
  role = await prisma.role.create({
    data: { name: "AGENCY_ADMIN", agencyId, isSystem: true, isEditable: false, isDeletable: false, isAssignable: true },
    select: { id: true },
  });
  for (const p of perms) {
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: p.id } });
  }
  return { roleAdminId: role.id };
}

/** Remove invariant-created data so the next ensureInvariantTestData() runs from a clean slate. */
export async function clearInvariantTestData(): Promise<void> {
  await prisma.user.deleteMany({
    where: { email: { in: [INVARIANT_SEED.USER_B_EMAIL, INVARIANT_SEED.USER_IP_EMAIL] } },
  });
  await prisma.agency.deleteMany({
    where: { slug: { in: [INVARIANT_SEED.AGENCY_B_SLUG, INVARIANT_SEED.AGENCY_IP_SLUG] } },
  });
}

export async function ensureInvariantTestData(): Promise<InvariantFixtures> {
  if (process.env.CLEAR_INVARIANT_TEST_DATA === "1" || process.env.CLEAR_INVARIANT_TEST_DATA === "true") {
    await clearInvariantTestData();
  }

  const apiPrefix = process.env.API_PREFIX ?? "/api/v1";
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const superadmin = await prisma.user.findFirst({
    where: { email: "superadmin@demo.com" },
    select: { id: true, email: true },
  });
  if (!superadmin) throw new Error("Invariant tests require seeded superadmin (superadmin@demo.com). Run db:seed first.");

  const demoAgency = await prisma.agency.findFirst({
    where: { slug: "demo-agency" },
    select: { id: true },
  });
  if (!demoAgency) throw new Error("Invariant tests require seeded demo agency. Run db:seed first.");

  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@demo.com", agencyId: demoAgency.id },
    select: { id: true, email: true },
  });
  if (!adminUser) throw new Error("Invariant tests require admin@demo.com in demo agency. Run db:seed first.");

  let agencyB = await prisma.agency.findFirst({ where: { slug: INVARIANT_SEED.AGENCY_B_SLUG }, select: { id: true } });
  if (!agencyB) {
    const plan = await prisma.plan.findFirst({ where: { isActive: true }, select: { id: true } });
    agencyB = await prisma.agency.create({
      data: {
        name: "Invariant Tenant B",
        slug: INVARIANT_SEED.AGENCY_B_SLUG,
        planId: plan?.id ?? null,
        onboardingCompleted: true,
      },
      select: { id: true },
    });
  }
  const { roleUserId } = await ensureAgencyBRoles(agencyB.id);

  let userB = await prisma.user.findFirst({
    where: { email: INVARIANT_SEED.USER_B_EMAIL, agencyId: agencyB.id },
    select: { id: true },
  });
  if (!userB) {
    userB = await prisma.user.create({
      data: {
        email: INVARIANT_SEED.USER_B_EMAIL,
        passwordHash,
        displayName: "Invariant User B",
        status: "ACTIVE",
        agencyId: agencyB.id,
        roleId: roleUserId,
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });
  }

  let agencyIp = await prisma.agency.findFirst({
    where: { slug: INVARIANT_SEED.AGENCY_IP_SLUG },
    select: { id: true, settings: true },
  });
  if (!agencyIp) {
    const plan = await prisma.plan.findFirst({ where: { isActive: true }, select: { id: true } });
    agencyIp = await prisma.agency.create({
      data: {
        name: "Invariant IP Guard Agency",
        slug: INVARIANT_SEED.AGENCY_IP_SLUG,
        planId: plan?.id ?? null,
        onboardingCompleted: true,
        settings: { ipAllowlist: ["10.0.0.0/8"] } as object,
      },
      select: { id: true, settings: true },
    });
  } else {
    const current = (agencyIp.settings as Record<string, unknown>) ?? {};
    if (!Array.isArray(current.ipAllowlist) || current.ipAllowlist.length === 0) {
      await prisma.agency.update({
        where: { id: agencyIp.id },
        data: { settings: { ...current, ipAllowlist: ["10.0.0.0/8"] } as object },
      });
    }
  }
  const { roleAdminId } = await ensureAgencyIpRoles(agencyIp!.id);

  let userIp = await prisma.user.findFirst({
    where: { email: INVARIANT_SEED.USER_IP_EMAIL, agencyId: agencyIp.id },
    select: { id: true },
  });
  if (!userIp) {
    userIp = await prisma.user.create({
      data: {
        email: INVARIANT_SEED.USER_IP_EMAIL,
        passwordHash,
        displayName: "Invariant IP User",
        status: "ACTIVE",
        agencyId: agencyIp.id,
        roleId: roleAdminId,
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });
  }

  return {
    apiPrefix,
    agencyAId: demoAgency.id,
    agencyBId: agencyB.id,
    userAEmail: "admin@demo.com",
    userBEmail: INVARIANT_SEED.USER_B_EMAIL,
    userAId: adminUser.id,
    userBId: userB.id,
    superadminEmail: superadmin.email,
    superadminId: superadmin.id,
    agencyIpId: agencyIp.id,
    userIpId: userIp.id,
  };
}

export const INVARIANT_PASSWORD = PASSWORD;
