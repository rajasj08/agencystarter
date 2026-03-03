import { prisma } from "../../lib/prisma.js";

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

export class AuditLogService {
  async list(
    agencyId: string,
    options: { page: number; limit: number; offset: number }
  ): Promise<{ data: AuditLogEntry[]; total: number }> {
    const where = { agencyId };
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        skip: options.offset,
        take: options.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
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
}
