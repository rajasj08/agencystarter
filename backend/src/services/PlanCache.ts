/**
 * In-memory cache for plans. Reload every 10 minutes.
 * Used by plan limiter and APIs to avoid DB hit per request.
 */

import { getPrismaForInternalUse } from "../lib/data-access.js";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface CachedPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  maxUsers: number;
  maxLocations: number;
  maxFacilities: number;
  maxEmployees: number;
  features: Record<string, boolean>;
  isActive: boolean;
  isDefault: boolean;
  isCustom: boolean | null;
}

let cache: CachedPlan[] | null = null;
let lastRefresh = 0;

function parseFeatures(features: unknown): Record<string, boolean> {
  if (features && typeof features === "object" && !Array.isArray(features)) {
    return features as Record<string, boolean>;
  }
  return {};
}

export async function refreshPlanCache(): Promise<CachedPlan[]> {
  const prisma = getPrismaForInternalUse();
  const rows = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      price: true,
      maxUsers: true,
      maxLocations: true,
      maxFacilities: true,
      maxEmployees: true,
      features: true,
      isActive: true,
      isDefault: true,
      isCustom: true,
    },
  });
  cache = rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    price: r.price,
    maxUsers: r.maxUsers,
    maxLocations: r.maxLocations,
    maxFacilities: r.maxFacilities,
    maxEmployees: r.maxEmployees,
    features: parseFeatures(r.features),
    isActive: r.isActive,
    isDefault: r.isDefault,
    isCustom: r.isCustom,
  }));
  lastRefresh = Date.now();
  return cache;
}

export function getPlanCache(): CachedPlan[] {
  return cache ?? [];
}

export async function getPlansCached(): Promise<CachedPlan[]> {
  if (cache === null || Date.now() - lastRefresh > CACHE_TTL_MS) {
    return refreshPlanCache();
  }
  return cache;
}

export function getPlanByIdCached(planId: string): CachedPlan | null {
  const list = cache ?? [];
  return list.find((p) => p.id === planId) ?? null;
}

export function getPlanByCodeCached(code: string): CachedPlan | null {
  const list = cache ?? [];
  return list.find((p) => p.code === code) ?? null;
}

export function invalidatePlanCache(): void {
  cache = null;
}
