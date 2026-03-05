/**
 * Prisma client singleton. This module is the only place that creates the client.
 *
 * Application code (services, controllers) must NOT import prisma from here.
 * Use lib/data-access.js instead: it exports repository instances and getPrismaForInternalUse()
 * for the few allowed internal callers (caches, seed scripts, transactions). Wrapping access
 * through data-access ensures all tenant-scoped reads go through scoped repositories.
 */
import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

prisma.$connect().catch((err: unknown) => {
  logger.error("Prisma connect failed", err);
  process.exit(1);
});
