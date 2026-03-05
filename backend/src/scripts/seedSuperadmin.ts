import bcrypt from "bcryptjs";
import { getPrismaForInternalUse } from "../lib/data-access.js";
import { ROLES } from "../constants/roles.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * If SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are set and no SUPER_ADMIN user exists,
 * creates one. Safe to call on every startup.
 */
export async function seedSuperadmin(): Promise<void> {
  const email = env.SUPERADMIN_EMAIL?.trim();
  const password = env.SUPERADMIN_PASSWORD;
  if (!email || !password) return;

  const prisma = getPrismaForInternalUse();
  const roleSuperAdmin = await prisma.role.findFirst({
    where: { name: ROLES.SUPER_ADMIN, agencyId: null, isSystem: true },
    select: { id: true },
  });
  const existing = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        ...(roleSuperAdmin ? [{ roleId: roleSuperAdmin.id }] : []),
        { role: ROLES.SUPER_ADMIN },
      ],
    },
  });
  if (existing) return;
  if (!roleSuperAdmin) {
    logger.warn("SUPER_ADMIN role not found. Run: npx prisma db seed");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      roleId: roleSuperAdmin.id,
      status: "ACTIVE",
      agencyId: null,
    },
  });
  logger.info("Superadmin user created from env (SUPERADMIN_EMAIL)");
}
