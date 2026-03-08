import type { EmailSenderConfig } from "../types/email-sender-config.js";
import { env } from "../../../config/env.js";
import { settingsRepository } from "../../../lib/data-access.js";

/**
 * System SMTP from environment. Used as fallback when agency SMTP is not configured.
 */
export function getSystemEmailConfig(): EmailSenderConfig {
  const host = env.SMTP_HOST?.trim() ?? "";
  const port = env.SMTP_PORT ?? 587;
  return {
    host: host || "localhost",
    port,
    secure: port === 465,
    user: env.SMTP_USER?.trim() || undefined,
    pass: env.SMTP_PASS || undefined,
    fromEmail: env.SMTP_FROM?.trim() || "noreply@example.com",
    fromName: env.APP_NAME ?? "Agency Starter",
    replyTo: undefined,
  };
}

/**
 * Agency SMTP from Agency.settings (JSON). Returns null if not configured or disabled.
 * Uses explicit smtpEnabled: true to use agency SMTP; if smtpEnabled is false or unset with host present, still requires host (backward compat: host set + no smtpEnabled = enabled).
 */
export async function getAgencyEmailConfig(
  agencyId: string
): Promise<EmailSenderConfig | null> {
  const raw = await settingsRepository.getAgencySettings(agencyId);
  const settings =
    typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const smtpEnabled = settings.smtpEnabled as boolean | undefined;
  if (smtpEnabled === false) return null;

  const host = (settings.smtpHost as string)?.trim();
  if (!host) return null;

  const port = Number(settings.smtpPort) || 587;
  const user = (settings.smtpUsername as string)?.trim();
  const pass = settings.smtpPassword as string | undefined;
  const fromEmail = String(settings.senderEmail ?? "").trim() || "noreply@example.com";
  const fromName = String(settings.senderName ?? "").trim() || "Agency";
  const replyTo = (settings.replyTo as string)?.trim() || undefined;

  return {
    host,
    port,
    secure: port === 465,
    user: user || undefined,
    pass: pass || undefined,
    fromEmail,
    fromName,
    replyTo: replyTo || undefined,
  };
}

/**
 * Resolve sender: agency SMTP if agencyId provided and agency has SMTP configured; otherwise system SMTP.
 */
export async function resolveEmailSender(
  agencyId?: string | null
): Promise<EmailSenderConfig> {
  if (agencyId) {
    const agency = await getAgencyEmailConfig(agencyId);
    if (agency) return agency;
  }
  return getSystemEmailConfig();
}
