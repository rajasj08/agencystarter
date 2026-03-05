import { auditLogRepository } from "../../lib/data-access.js";
import { AuditLogRepository } from "./audit-log.repository.js";

function userDisplayName(user: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string | null {
  if (user.displayName?.trim()) return user.displayName.trim();
  const parts = [user.firstName, user.lastName].filter((s) => s != null && String(s).trim() !== "");
  return parts.length > 0 ? parts.join(" ").trim() : null;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  createdAt: Date;
}

export interface AuditExportFilters {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  action?: string | null;
  userId?: string | null;
  resource?: string | null;
}

export type AuditExportFormat = "json" | "csv";

export class AuditLogService {
  async list(
    agencyId: string,
    options: { page: number; limit: number; offset: number; sortBy?: string; sortOrder?: "asc" | "desc" }
  ): Promise<{ data: AuditLogEntry[]; total: number }> {
    const { rows, total } = await auditLogRepository.listByAgency(agencyId, {
      offset: options.offset,
      limit: options.limit,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
    });
    const data: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.user.email,
      userName: userDisplayName(r.user),
      action: r.action,
      resource: r.resource,
      resourceId: r.resourceId,
      createdAt: r.createdAt,
    }));
    return { data, total };
  }

  /** Export audit logs for tenant. Paginated; max EXPORT_MAX_LIMIT per request. */
  async exportTenant(
    agencyId: string,
    filters: AuditExportFilters,
    format: AuditExportFormat,
    options: { offset: number; limit: number }
  ): Promise<{ data: AuditLogEntry[]; total: number; format: AuditExportFormat }> {
    const limit = Math.min(options.limit, AuditLogRepository.EXPORT_MAX_LIMIT);
    const { rows, total } = await auditLogRepository.listByAgency(agencyId, {
      offset: options.offset,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      action: filters.action,
      userId: filters.userId,
      resource: filters.resource,
    });
    const data: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.user.email,
      userName: userDisplayName(r.user),
      action: r.action,
      resource: r.resource,
      resourceId: r.resourceId,
      createdAt: r.createdAt,
    }));
    return { data, total, format };
  }

  /** Export audit logs for platform (superadmin). Paginated; max EXPORT_MAX_LIMIT per request. */
  async exportPlatform(
    filters: AuditExportFilters,
    format: AuditExportFormat,
    options: { offset: number; limit: number }
  ): Promise<{ data: AuditLogEntry[]; total: number; format: AuditExportFormat }> {
    const limit = Math.min(options.limit, AuditLogRepository.EXPORT_MAX_LIMIT);
    const { rows, total } = await auditLogRepository.listAllPlatform({
      offset: options.offset,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      action: filters.action,
      userId: filters.userId,
      resource: filters.resource,
    });
    const data: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.user.email,
      userName: userDisplayName(r.user),
      action: r.action,
      resource: r.resource,
      resourceId: r.resourceId,
      createdAt: r.createdAt,
    }));
    return { data, total, format };
  }

  /** Serialize export page to CSV string (header + rows). No sensitive fields. */
  toCsv(entries: AuditLogEntry[]): string {
    const header = "id,userId,userEmail,userName,action,resource,resourceId,createdAt";
    const escape = (v: string | null): string => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = entries.map(
      (e) =>
        [
          e.id,
          e.userId,
          e.userEmail,
          e.userName,
          e.action,
          e.resource,
          e.resourceId,
          e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        ]
          .map(escape)
          .join(",")
    );
    return [header, ...rows].join("\n");
  }
}
