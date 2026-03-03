/**
 * Create a SUPER_ADMIN user. Run from backend root:
 *   npx tsx scripts/create-superadmin.ts <email> <password> [name]
 *
 * The user is created with:
 *   role = SUPER_ADMIN
 *   agencyId = null
 *   status = ACTIVE
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLES } from "../src/constants/roles.js";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? "Super Admin";

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-superadmin.ts <email> <password> [name]");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase(), deletedAt: null },
  });
  if (existing) {
    if (existing.role === ROLES.SUPER_ADMIN) {
      console.log("A super admin with this email already exists.");
      process.exit(0);
    }
    console.error("A user with this email already exists and is not a super admin.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      displayName: name.trim() || null,
      role: ROLES.SUPER_ADMIN,
      status: "ACTIVE",
      agencyId: null,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Super admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
