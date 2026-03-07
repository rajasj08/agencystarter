import type { PrismaClient, UserStatus, Prisma } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";
import { tenantScopeStrict } from "../../lib/tenant.js";

/** Prisma client or transaction client (has same model delegates). */
type PrismaClientLike = Pick<PrismaClient, "user">;

export class UserRepository extends BaseRepository {
  constructor(client: PrismaClient) {
    super(client);
  }

  async findByIdAndAgency(id: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { id, ...this.activeOnly(), ...tenantScopeStrict(agencyId) },
      include: {
        agency: true,
        roleRef: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByEmailAndAgency(email: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), ...this.activeOnly(), ...tenantScopeStrict(agencyId) },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  private static readonly LIST_SORT_FIELDS = new Set(["displayName", "email", "status", "createdAt", "role"]);

  async listByAgency(
    agencyId: string,
    options: {
      offset: number;
      limit: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      search?: string;
      status?: string;
    }
  ) {
    const sortOrder = options.sortOrder ?? "desc";
    const orderBy =
      options.sortBy && UserRepository.LIST_SORT_FIELDS.has(options.sortBy)
        ? options.sortBy === "role"
          ? ({ roleRef: { name: sortOrder } } as const)
          : { [options.sortBy]: sortOrder }
        : { createdAt: "desc" as const };
    const showDeletedOnly = options.status === "DELETED";
    const where: Prisma.UserWhereInput = {
      ...(showDeletedOnly ? {} : this.activeOnly()),
      ...tenantScopeStrict(agencyId),
    };
    if (showDeletedOnly) {
      where.deletedAt = { not: null };
    } else {
      if (options.status === "PENDING") {
        where.status = { in: ["INVITED", "PENDING_VERIFICATION"] };
      } else {
        const validStatuses = ["ACTIVE", "DISABLED", "SUSPENDED", "INVITED"] as const;
        if (options.status && validStatuses.includes(options.status as (typeof validStatuses)[number])) {
          where.status = options.status as (typeof validStatuses)[number];
        }
      }
    }
    if (options.search?.trim()) {
      const term = `%${options.search.trim()}%`;
      where.OR = [
        { email: { contains: term, mode: "insensitive" } },
        { displayName: { contains: term, mode: "insensitive" } },
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { agency: true, roleRef: { select: { id: true, name: true } } },
        skip: options.offset,
        take: options.limit,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  async create(data: {
    email: string;
    passwordHash: string | null;
    displayName?: string | null;
    roleId: string;
    status: UserStatus;
    agencyId: string;
    emailVerifiedAt?: Date | null;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        displayName: data.displayName ?? null,
        roleId: data.roleId,
        status: data.status,
        agencyId: data.agencyId,
        emailVerifiedAt: data.emailVerifiedAt ?? undefined,
      },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  async update(
    id: string,
    agencyId: string,
    data: {
      displayName?: string | null;
      roleId?: string;
      status?: UserStatus;
      updatedById?: string | null;
      emailVerifiedAt?: Date | null;
    },
    tx?: PrismaClientLike
  ) {
    const client = (tx ?? this.prisma) as PrismaClient;
    const { roleId, updatedById, emailVerifiedAt, ...rest } = data;
    const updateData = {
      ...rest,
      ...(roleId !== undefined && { roleId }),
      ...(updatedById !== undefined && { updatedById }),
      ...(emailVerifiedAt !== undefined && { emailVerifiedAt }),
    };
    return client.user.updateMany({
      where: { id, ...tenantScopeStrict(agencyId) },
      data: updateData,
    });
  }

  async updatePassword(id: string, agencyId: string, passwordHash: string) {
    return this.prisma.user.updateMany({
      where: { id, ...tenantScopeStrict(agencyId) },
      data: { passwordHash },
    });
  }

  async softDelete(id: string, agencyId: string, options?: { tx?: PrismaClientLike; updatedById?: string | null }) {
    const client = (options?.tx ?? this.prisma) as PrismaClient;
    return client.user.updateMany({
      where: { id, ...tenantScopeStrict(agencyId) },
      data: {
        deletedAt: new Date(),
        status: "DISABLED" as UserStatus,
        ...(options?.updatedById !== undefined && { updatedById: options.updatedById }),
      },
    });
  }

  /** Find user by id and agency including soft-deleted (for restore validation and deleted-by display). */
  async findByIdAndAgencyIncludingDeleted(id: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { id, ...tenantScopeStrict(agencyId) },
      include: {
        agency: true,
        roleRef: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
      },
    });
  }

  /** Restore soft-deleted user: set deletedAt = null, status = ACTIVE. Does not change authProvider, providerId, passwordHash. */
  async restoreUser(id: string, agencyId: string) {
    await this.prisma.user.updateMany({
      where: { id, ...tenantScopeStrict(agencyId) },
      data: { deletedAt: null, status: "ACTIVE" as UserStatus },
    });
    return this.prisma.user.findFirst({
      where: { id, ...tenantScopeStrict(agencyId) },
      include: { agency: true, roleRef: { select: { id: true, name: true } } },
    });
  }

  /** Count users assigned to this role (for delete guard). Role is already agency-scoped. */
  async countByRoleId(roleId: string): Promise<number> {
    return this.prisma.user.count({ where: { roleId } });
  }

  /** Count active (non-deleted) users in agency. For plan limits and config limits. */
  async countActiveByAgency(agencyId: string): Promise<number> {
    return this.prisma.user.count({
      where: { ...this.activeOnly(), ...tenantScopeStrict(agencyId) },
    });
  }

  /** Count active users in agency with role AGENCY_ADMIN (for last-admin protection). */
  async countAgencyAdmins(agencyId: string, tx?: PrismaClientLike): Promise<number> {
    const client = (tx ?? this.prisma) as PrismaClient;
    return client.user.count({
      where: {
        ...this.activeOnly(),
        ...tenantScopeStrict(agencyId),
        roleRef: { name: "AGENCY_ADMIN" },
      },
    });
  }

  /** Platform only: count all active users (deletedAt: null). For metrics. */
  countAllActive(): Promise<number> {
    return this.prisma.user.count({ where: { deletedAt: null } });
  }

  /** Platform only: list all users (no agencyId filter). Explicitly unscoped for superadmin. */
  listAllForPlatform(options: {
    where?: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    const where: Prisma.UserWhereInput = options.where ?? { deletedAt: null };
    return Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: options.orderBy,
        skip: options.skip,
        take: options.take,
        include: { agency: { select: { name: true } }, roleRef: { select: { name: true } } },
      }),
      this.prisma.user.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  /** Platform only: get user by id (active only). For superadmin user detail. */
  findByIdForPlatform(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { agency: { select: { id: true, name: true } }, roleRef: { select: { id: true, name: true } } },
    });
  }

  /** Platform only: get user by id including soft-deleted. For superadmin edit page. */
  findByIdForPlatformIncludingDeleted(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId },
      include: { agency: { select: { id: true, name: true } }, roleRef: { select: { id: true, name: true } } },
    });
  }

  /** Platform only: soft-delete user by id (no agency scope). For superadmin delete. */
  async softDeleteForPlatform(userId: string) {
    return this.prisma.user.updateMany({
      where: { id: userId },
      data: { deletedAt: new Date(), status: "DISABLED" as UserStatus },
    });
  }

  /** Platform only: restore soft-deleted user by id (no agency scope). For superadmin restore. */
  async restoreUserForPlatform(userId: string) {
    return this.prisma.user.updateMany({
      where: { id: userId },
      data: { deletedAt: null, status: "ACTIVE" as UserStatus },
    });
  }

  /** Platform only: update user by id (status, roleId, passwordHash, emailVerifiedAt, forcePasswordChange). */
  updateByUserIdPlatform(
    userId: string,
    data: {
      status?: UserStatus;
      roleId?: string;
      passwordHash?: string;
      emailVerifiedAt?: Date | null;
      forcePasswordChange?: boolean;
    }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.emailVerifiedAt !== undefined && { emailVerifiedAt: data.emailVerifiedAt }),
        ...(data.forcePasswordChange !== undefined && { forcePasswordChange: data.forcePasswordChange }),
      },
    });
  }

  /** Display info for "updated by" etc. Platform/global lookup by user id (no tenant scope). */
  findUserDisplayById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
    });
  }

  /** Onboarding: set current user's agency and role (user may not have agencyId yet). Call only when creating/joining an agency. */
  async updateAgencyAndRoleForOnboarding(userId: string, agencyId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { agencyId, roleId },
    });
  }

  async getByIdForUpdate(id: string, agencyId: string) {
    return this.prisma.user.findFirst({
      where: { id, ...this.activeOnly(), ...tenantScopeStrict(agencyId) },
      include: {
        agency: true,
        roleRef: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, email: true, displayName: true, firstName: true, lastName: true } },
      },
    });
  }
}
