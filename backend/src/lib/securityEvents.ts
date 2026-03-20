import { logger } from "../utils/logger.js";

export type SecurityEventType =
  | "denied_superadmin_action"
  | "api_key_abuse"
  | "tenant_slug_probe_spike";

export function emitSecurityEvent(type: SecurityEventType, details: Record<string, unknown>): void {
  logger.warn("SECURITY_EVENT", { type, ...details, at: new Date().toISOString() });
}

