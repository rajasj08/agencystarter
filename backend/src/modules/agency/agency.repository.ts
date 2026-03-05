import type { PrismaClient } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";

export class AgencyRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  findBySlug(slug: string) {
    return this.prisma.agency.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.agency.findUnique({
      where: { id },
      include: { users: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true, role: true } } },
    });
  }

  /** For platform/superadmin: agency with plan and user count. */
  findByIdWithPlanAndCount(id: string) {
    return this.prisma.agency.findUnique({
      where: { id },
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
  }

  /** Platform: list agencies with plan and user count. */
  listWithPlanAndCount(orderBy: { [k: string]: "asc" | "desc" }, skip: number, take: number) {
    return this.prisma.agency.findMany({
      orderBy,
      skip,
      take,
      include: { _count: { select: { users: true } }, plan: { select: { name: true, code: true } } },
    });
  }

  /** Platform: total agency count. */
  countAll() {
    return this.prisma.agency.count();
  }

  create(data: { name: string; slug: string; planId?: string | null; onboardingCompleted?: boolean }) {
    return this.prisma.agency.create({
      data: {
        name: data.name,
        slug: data.slug,
        ...(data.planId != null && { planId: data.planId }),
        ...(data.onboardingCompleted === true && { onboardingCompleted: true }),
      },
    });
  }

  setOnboardingCompleted(agencyId: string) {
    return this.prisma.agency.update({
      where: { id: agencyId },
      data: { onboardingCompleted: true },
    });
  }

  list() {
    return this.prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  updatePartial(agencyId: string, data: Record<string, unknown>) {
    return this.prisma.agency.update({
      where: { id: agencyId },
      data: data as Record<string, unknown>,
    });
  }
}
