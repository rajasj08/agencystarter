import type { PrismaClient } from "@prisma/client";
import { BaseRepository } from "../../core/BaseRepository.js";

export interface CreateAuditLogData {
  agencyId: string | null;
  userId: string;
  targetUserId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: object | null;
  impersonation?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  create(data: CreateAuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        agencyId: data.agencyId,
        userId: data.userId,
        targetUserId: data.targetUserId ?? null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        details: data.details ?? undefined,
        impersonation: data.impersonation ?? false,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  private static readonly LIST_SORT_FIELDS = new Set(["createdAt", "action", "resource"]);
  static readonly EXPORT_MAX_LIMIT = 10_000;

  /** Tenant-scoped list: always filtered by agencyId. Supports export filters. */
  listByAgency(
    agencyId: string,
    options: {
      offset: number;
      limit: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      dateFrom?: Date | null;
      dateTo?: Date | null;
      action?: string | null;
      userId?: string | null;
      resource?: string | null;
    }
  ) {
    const where: {
      agencyId: string;
      createdAt?: { gte?: Date; lte?: Date };
      action?: string;
      userId?: string;
      resource?: string;
    } = { agencyId };
    if (options.dateFrom || options.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = options.dateFrom;
      if (options.dateTo) where.createdAt.lte = options.dateTo;
    }
    if (options.action?.trim()) where.action = options.action.trim();
    if (options.userId?.trim()) where.userId = options.userId.trim();
    if (options.resource?.trim()) where.resource = options.resource.trim();

    const sortOrder = options.sortOrder ?? "desc";
    const orderBy =
      options.sortBy && AuditLogRepository.LIST_SORT_FIELDS.has(options.sortBy)
        ? { [options.sortBy]: sortOrder }
        : { createdAt: "desc" as const };
    const take = Math.min(options.limit, AuditLogRepository.EXPORT_MAX_LIMIT);
    return Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true } } },
        orderBy,
        skip: options.offset,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  /** Platform-only: list all audit logs (superadmin). Supports export filters. */
  listAllPlatform(options: {
    offset: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    dateFrom?: Date | null;
    dateTo?: Date | null;
    action?: string | null;
    userId?: string | null;
    resource?: string | null;
  }) {
    const where: {
      createdAt?: { gte?: Date; lte?: Date };
      action?: string;
      userId?: string;
      resource?: string;
    } = {};
    if (options.dateFrom || options.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = options.dateFrom;
      if (options.dateTo) where.createdAt.lte = options.dateTo;
    }
    if (options.action?.trim()) where.action = options.action.trim();
    if (options.userId?.trim()) where.userId = options.userId.trim();
    if (options.resource?.trim()) where.resource = options.resource.trim();

    const sortOrder = options.sortOrder ?? "desc";
    const orderBy =
      options.sortBy && AuditLogRepository.LIST_SORT_FIELDS.has(options.sortBy)
        ? { [options.sortBy]: sortOrder }
        : { createdAt: "desc" as const };
    const take = Math.min(options.limit, AuditLogRepository.EXPORT_MAX_LIMIT);
    return Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true } } },
        orderBy,
        skip: options.offset,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }
}
