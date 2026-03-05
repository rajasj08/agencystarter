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

  /** Tenant-scoped list: always filtered by agencyId. */
  listByAgency(
    agencyId: string,
    options: { offset: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc" }
  ) {
    const where = { agencyId };
    const sortOrder = options.sortOrder ?? "desc";
    const orderBy =
      options.sortBy && AuditLogRepository.LIST_SORT_FIELDS.has(options.sortBy)
        ? { [options.sortBy]: sortOrder }
        : { createdAt: "desc" as const };
    return Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true } } },
        orderBy,
        skip: options.offset,
        take: options.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]).then(([rows, total]) => ({ rows, total }));
  }

  /** Platform-only: list all audit logs (superadmin). Unscoped by design. */
  listAllPlatform(options: {
    offset: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const sortOrder = options.sortOrder ?? "desc";
    const orderBy =
      options.sortBy && AuditLogRepository.LIST_SORT_FIELDS.has(options.sortBy)
        ? { [options.sortBy]: sortOrder }
        : { createdAt: "desc" as const };
    return Promise.all([
      this.prisma.auditLog.findMany({
        include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true } } },
        orderBy,
        skip: options.offset,
        take: options.limit,
      }),
      this.prisma.auditLog.count(),
    ]).then(([rows, total]) => ({ rows, total }));
  }
}
