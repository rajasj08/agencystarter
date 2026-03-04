import type { PrismaClient, UserStatus } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";
import { tenantScope } from "../../lib/tenant.js";

/** Prisma client or transaction client (has same model delegates). */
type PrismaClientLike = Pick<PrismaClient, "user">;

export class UserRepository extends BaseRepository {
  constructor(client: PrismaClient) {
    super(client);
  }

  async findByIdAndAgency(id: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { id, ...this.activeOnly(), ...tenantScope(agencyId) },
      include: {
        agency: true,
        roleRef: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByEmailAndAgency(email: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), ...this.activeOnly(), ...tenantScope(agencyId) },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  async listByAgency(
    agencyId: string,
    options: { offset: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc" }
  ) {
    const orderBy = (options.sortBy && options.sortOrder)
      ? { [options.sortBy]: options.sortOrder }
      : { createdAt: "desc" as const };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...this.activeOnly(), ...tenantScope(agencyId) },
        include: { agency: true, roleRef: { select: { id: true, name: true } } },
        skip: options.offset,
        take: options.limit,
        orderBy,
      }),
      this.prisma.user.count({ where: { ...this.activeOnly(), ...tenantScope(agencyId) } }),
    ]);
    return { data, total };
  }

  async create(data: {
    email: string;
    passwordHash: string;
    displayName?: string | null;
    roleId: string;
    status: UserStatus;
    agencyId: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        displayName: data.displayName ?? null,
        roleId: data.roleId,
        status: data.status,
        agencyId: data.agencyId,
      },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  async update(
    id: string,
    agencyId: string,
    data: { displayName?: string | null; roleId?: string; status?: UserStatus; updatedById?: string | null },
    tx?: PrismaClientLike
  ) {
    const client = (tx ?? this.prisma) as PrismaClient;
    const { roleId, updatedById, ...rest } = data;
    const updateData = {
      ...rest,
      ...(roleId !== undefined && { roleId }),
      ...(updatedById !== undefined && { updatedById }),
    };
    return client.user.updateMany({
      where: { id, ...tenantScope(agencyId) },
      data: updateData,
    });
  }

  async updatePassword(id: string, agencyId: string, passwordHash: string) {
    return this.prisma.user.updateMany({
      where: { id, ...tenantScope(agencyId) },
      data: { passwordHash },
    });
  }

  async softDelete(id: string, agencyId: string, tx?: PrismaClientLike) {
    const client = (tx ?? this.prisma) as PrismaClient;
    return client.user.updateMany({
      where: { id, ...tenantScope(agencyId) },
      data: { deletedAt: new Date(), status: "DISABLED" as UserStatus },
    });
  }

  /** Count active users in agency with role AGENCY_ADMIN (for last-admin protection). */
  async countAgencyAdmins(agencyId: string, tx?: PrismaClientLike): Promise<number> {
    const client = (tx ?? this.prisma) as PrismaClient;
    return client.user.count({
      where: {
        ...this.activeOnly(),
        ...tenantScope(agencyId),
        roleRef: { name: "AGENCY_ADMIN" },
      },
    });
  }

  async getByIdForUpdate(id: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { id, ...this.activeOnly(), ...tenantScope(agencyId) },
      include: {
        agency: true,
        roleRef: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
      },
    });
  }
}
