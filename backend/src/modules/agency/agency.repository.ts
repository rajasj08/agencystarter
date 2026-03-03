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

  create(data: { name: string; slug: string; planId?: string | null }) {
    return this.prisma.agency.create({
      data: {
        name: data.name,
        slug: data.slug,
        ...(data.planId != null && { planId: data.planId }),
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
}
