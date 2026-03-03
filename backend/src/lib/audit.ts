import { prisma } from "./prisma.js";
import type { AuthRequest } from "../middleware/auth.js";

export interface AuditPayload {
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  targetUserId?: string | null;
  impersonation?: boolean;
}

/**
 * Write an audit log entry. Call from controllers after successful mutations.
 * Uses req.user and req (ip, userAgent) when available.
 */
export async function audit(req: AuthRequest | null, payload: AuditPayload): Promise<void> {
  const userId = req?.user?.userId;
  if (!userId) return;

  await prisma.auditLog.create({
    data: {
      agencyId: req?.user?.agencyId ?? null,
      userId,
      targetUserId: payload.targetUserId ?? null,
      action: payload.action,
      resource: payload.resource,
      resourceId: payload.resourceId ?? null,
      details: payload.details ? (payload.details as object) : undefined,
      impersonation: payload.impersonation ?? false,
      ipAddress: (req?.ip ?? (req as unknown as { ip?: string })?.ip) ?? null,
      userAgent: req?.get?.("user-agent") ?? null,
    },
  });
}
