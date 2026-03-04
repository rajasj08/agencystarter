import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedRbac, createAgencyRoles } from "./seed-rbac.js";
import { seedPlans } from "./seed-plans.js";

const prisma = new PrismaClient();

async function main() {
  const { roleSuperAdmin } = await seedRbac();
  const { freePlanId } = await seedPlans();

  const passwordHash = await bcrypt.hash("SeedPassword1!", 12);

  const agency = await prisma.agency.upsert({
    where: { slug: "demo-agency" },
    update: { planId: freePlanId },
    create: {
      name: "Demo Agency",
      slug: "demo-agency",
      planId: freePlanId,
      onboardingCompleted: true,
    },
  });

  const { roleAgencyAdmin } = await createAgencyRoles(prisma, agency.id);

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { roleId: roleAgencyAdmin.id },
    create: {
      email: "admin@demo.com",
      passwordHash,
      displayName: "Demo Admin",
      roleId: roleAgencyAdmin.id,
      status: "ACTIVE",
      agencyId: agency.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "superadmin@demo.com" },
    update: { roleId: roleSuperAdmin.id },
    create: {
      email: "superadmin@demo.com",
      passwordHash,
      displayName: "Super Admin",
      roleId: roleSuperAdmin.id,
      status: "ACTIVE",
      agencyId: null,
      emailVerifiedAt: new Date(),
    },
  });

  console.log("Seed completed: RBAC, plans, demo agency, admin@demo.com, superadmin@demo.com created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
