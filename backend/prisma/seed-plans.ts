/**
 * Seeds default plans (FREE, STARTER, PRO, ENTERPRISE).
 * Run as part of main seed. Idempotent (upsert by code).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_FEATURES = { reports: true, auditLogs: true };

const DEFAULT_PLANS = [
  {
    code: "FREE",
    name: "Free",
    description: "Free tier for getting started",
    price: 0,
    maxUsers: 5,
    maxLocations: 1,
    maxFacilities: 1,
    maxEmployees: 10,
    features: { reports: false, auditLogs: false },
    isDefault: true,
    isCustom: null as boolean | null,
  },
  {
    code: "STARTER",
    name: "Starter",
    description: "For small teams",
    price: 999,
    maxUsers: 20,
    maxLocations: 5,
    maxFacilities: 10,
    maxEmployees: 100,
    features: DEFAULT_FEATURES,
    isDefault: false,
    isCustom: null as boolean | null,
  },
  {
    code: "PRO",
    name: "Pro",
    description: "For growing organizations",
    price: 2999,
    maxUsers: 100,
    maxLocations: 20,
    maxFacilities: 50,
    maxEmployees: 500,
    features: DEFAULT_FEATURES,
    isDefault: false,
    isCustom: null as boolean | null,
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "Unlimited scale",
    price: 0,
    maxUsers: -1,
    maxLocations: -1,
    maxFacilities: -1,
    maxEmployees: -1,
    features: { reports: true, auditLogs: true },
    isDefault: false,
    isCustom: true,
  },
] as const;

export async function seedPlans(): Promise<{ freePlanId: string }> {
  for (const p of DEFAULT_PLANS) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description ?? undefined,
        price: p.price,
        maxUsers: p.maxUsers,
        maxLocations: p.maxLocations,
        maxFacilities: p.maxFacilities,
        maxEmployees: p.maxEmployees,
        features: p.features as object,
        isActive: true,
        isDefault: p.isDefault,
        isCustom: p.isCustom ?? undefined,
      },
      create: {
        code: p.code,
        name: p.name,
        description: p.description ?? undefined,
        price: p.price,
        maxUsers: p.maxUsers,
        maxLocations: p.maxLocations,
        maxFacilities: p.maxFacilities,
        maxEmployees: p.maxEmployees,
        features: p.features as object,
        isActive: true,
        isDefault: p.isDefault,
        isCustom: p.isCustom ?? undefined,
      },
    });
  }
  const free = await prisma.plan.findUnique({ where: { code: "FREE" }, select: { id: true } });
  if (!free) throw new Error("FREE plan not found after seed");
  return { freePlanId: free.id };
}
