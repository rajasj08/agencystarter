import type { PrismaClient } from "@prisma/client";

export class PlansRepository {
  constructor(private prisma: PrismaClient) {}

  findMany(activeOnly = false) {
    return this.prisma.plan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { code: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.plan.findUnique({
      where: { id },
    });
  }

  findByCode(code: string) {
    return this.prisma.plan.findFirst({
      where: { code },
    });
  }

  create(data: {
    name: string;
    code: string;
    description?: string | null;
    price: number;
    maxUsers: number;
    maxLocations: number;
    maxFacilities: number;
    maxEmployees: number;
    features?: Record<string, boolean>;
    isActive?: boolean;
    isDefault?: boolean;
    isCustom?: boolean | null;
    createdById?: string | null;
  }) {
    return this.prisma.plan.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description ?? undefined,
        price: data.price,
        maxUsers: data.maxUsers,
        maxLocations: data.maxLocations,
        maxFacilities: data.maxFacilities,
        maxEmployees: data.maxEmployees,
        features: (data.features ?? {}) as object,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        isCustom: data.isCustom ?? undefined,
        createdById: data.createdById ?? undefined,
      },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      price?: number;
      maxUsers?: number;
      maxLocations?: number;
      maxFacilities?: number;
      maxEmployees?: number;
      features?: Record<string, boolean>;
      isActive?: boolean;
      isDefault?: boolean;
      isCustom?: boolean | null;
      updatedById?: string | null;
    }
  ) {
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...data,
        ...(data.features !== undefined && { features: data.features as object }),
      },
    });
  }

  /** Set isDefault = false for all plans except the one with the given id. Ensures only one default. */
  clearOtherDefaults(exceptPlanId: string) {
    return this.prisma.plan.updateMany({
      where: { id: { not: exceptPlanId } },
      data: { isDefault: false },
    });
  }

  setInactive(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  countAgenciesByPlanId(planId: string) {
    return this.prisma.agency.count({
      where: { planId },
    });
  }
}
