import { auditLogRepository } from "./data-access.js";
import type { AuthRequest } from "../middleware/auth.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "refreshToken",
  "refreshTokenHash",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "confirmNewPassword",
  "temporaryPassword",
  "secret",
  "apiKey",
  "authorization",
]);

function sanitizeDetails(details: Record<string, unknown> | null | undefined): object | undefined {
  if (!details || typeof details !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    const keyLower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(k) || SENSITIVE_KEYS.has(keyLower) || keyLower.includes("password") || keyLower.includes("token")) {
      continue;
    }
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export interface AuditPayload {
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  targetUserId?: string | null;
  impersonation?: boolean;
}

/** Standard RBAC audit details for compliance (SOC2). */
export interface RbacAuditDetails {
  actorUserId: string;
  targetRoleId: string;
  agencyId: string | null;
  previousPermissions?: string[];
  newPermissions?: string[];
  roleName?: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Write an audit log entry. Call from controllers after successful mutations.
 * Uses req.user and req (ip, userAgent) when available.
 * Strips password/token-like keys from details so they are never stored.
 */
export async function audit(req: AuthRequest | null, payload: AuditPayload): Promise<void> {
  const userId = req?.user?.userId;
  if (!userId) return;

  const details = sanitizeDetails(payload.details ?? null);

  await auditLogRepository.create({
    agencyId: req?.user?.agencyId ?? null,
    userId,
    targetUserId: payload.targetUserId ?? null,
    action: payload.action,
    resource: payload.resource,
    resourceId: payload.resourceId ?? null,
    details: details ?? undefined,
    impersonation: payload.impersonation ?? false,
    ipAddress: (req?.ip ?? (req as unknown as { ip?: string })?.ip) ?? null,
    userAgent: req?.get?.("user-agent") ?? null,
  });
}

/** Log audit for unauthenticated events (e.g. login). */
export async function auditLogin(meta: {
  userId: string;
  agencyId: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await auditLogRepository.create({
    userId: meta.userId,
    agencyId: meta.agencyId,
    action: "user.login",
    resource: "user",
    resourceId: meta.userId,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
  });
}
