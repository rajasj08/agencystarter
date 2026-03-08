import path from "node:path";
import fs from "node:fs";
import type { EmailTemplateKey, RenderedEmail } from "../types/email-template.js";
import { logger } from "../../../utils/logger.js";

const TEMPLATES_DIR = path.join(process.cwd(), "templates", "emails");

/** Template keys that have a .html file on disk (excludes e.g. "test" which is inline). */
const TEMPLATE_KEYS_WITH_FILES: EmailTemplateKey[] = [
  "verification",
  "password-reset",
  "password-reset-admin",
  "invitation",
];

/**
 * Read template HTML from disk (no cache) so file changes are picked up immediately.
 */
function getTemplateContentSync(key: EmailTemplateKey): string {
  if (!TEMPLATE_KEYS_WITH_FILES.includes(key)) return "";
  const filePath = path.join(TEMPLATES_DIR, `${key}.html`);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    logger.warn(`Email template not found: ${key}`, { path: filePath });
    return "";
  }
}

/**
 * Resolution order: agency override → system override → filesystem.
 * Returns null if no override exists.
 */
export async function findTemplateOverride(
  templateKey: EmailTemplateKey,
  agencyId?: string | null
): Promise<{ subject: string; htmlBody: string; textBody: string | null } | null> {
  const prisma = (await import("../../../lib/data-access.js")).getPrismaForInternalUse();
  if (agencyId) {
    const agencyOverride = await prisma.emailTemplateOverride.findFirst({
      where: { templateKey, agencyId, enabled: true },
    });
    if (agencyOverride) return agencyOverride;
  }
  const systemOverride = await prisma.emailTemplateOverride.findFirst({
    where: { templateKey, agencyId: null, enabled: true },
  });
  return systemOverride;
}

/** Subject line pattern for each template. Use {{organizationName}} for organization name (system = app name, agency = agency name). */
const TEMPLATE_SUBJECT: Record<EmailTemplateKey, string> = {
  verification: "Verify your email – {{organizationName}}",
  "password-reset": "Reset your password – {{organizationName}}",
  "password-reset-admin": "Reset your password – {{organizationName}}",
  invitation: "You're invited to join {{organizationName}}",
  test: "Test email from {{organizationName}}",
};

/**
 * Return raw filesystem template (subject pattern + HTML with {{variables}}).
 * Used by the template editor so admins see and edit placeholders, not sample values.
 */
export function getRawTemplateContent(templateKey: EmailTemplateKey): { subject: string; html: string } {
  const subject = TEMPLATE_SUBJECT[templateKey] ?? `Email – {{organizationName}}`;
  const html = templateKey === "test" ? "" : getTemplateContentSync(templateKey);
  return { subject, html };
}

/** Plain-text fallback for each template. Uses organizationName (organization name). */
const TEMPLATE_TEXT_FALLBACK: Record<EmailTemplateKey, (v: Record<string, string>) => string> = {
  verification: (v) =>
    `Hi ${v.userName ?? "there"},\n\nPlease verify your email by opening this link:\n${v.verificationLink}\n\n— ${v.organizationName ?? v.appName ?? ""}`,
  "password-reset": (v) =>
    `Hi ${v.userName ?? "there"},\n\nReset your password by opening this link (valid for ${v.expiryMinutes ?? ""} minutes):\n${v.resetLink}\n\n— ${v.organizationName ?? v.appName ?? ""}`,
  "password-reset-admin": (v) =>
    `Hi ${v.userName ?? "there"},\n\nAn administrator has sent you a password reset link for your ${v.organizationName ?? v.appName ?? ""} account. Open the link below to set a new password (valid for ${v.expiryMinutes ?? ""} minutes):\n${v.resetLink}\n\nIf you have any questions, contact your administrator.\n\n— ${v.organizationName ?? v.appName ?? ""}`,
  invitation: (v) =>
    `Hi ${v.userName ?? "there"},\n\nYou've been invited to create an account for ${v.organizationName ?? v.appName ?? ""}. Click the link below to set your password and get started. This link expires in ${v.expiryDisplay ?? ""}.\n\n${v.setPasswordLink ?? ""}\n\nIf you have any questions, contact your administrator.\n\n— ${v.organizationName ?? v.appName ?? ""}`,
  test: () =>
    "This is a test email. If you received this, your SMTP configuration is working.",
};

/**
 * Escape HTML to prevent injection when substituting into templates.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Replace {{key}} in str with variables. Optionally escape values for HTML context.
 */
function replaceVars(
  str: string,
  vars: Record<string, string>,
  escapeForHtml: boolean
): string {
  let out = str;
  for (const [key, value] of Object.entries(vars)) {
    const safe = value ?? "";
    const repl = escapeForHtml ? escapeHtml(safe) : safe;
    out = out.replace(new RegExp(`{{${key}}}`, "g"), repl);
  }
  return out;
}


/**
 * Render a template: load HTML, substitute variables (HTML-escaped), build subject and text.
 * Uses filesystem only (no DB override).
 */
export function renderTemplate(
  templateKey: EmailTemplateKey,
  variables: Record<string, string>
): RenderedEmail {
  const subjectPattern = TEMPLATE_SUBJECT[templateKey] ?? `Email – {{organizationName}}`;
  const subject = replaceVars(subjectPattern, variables, false);

  let html = "";
  if (templateKey !== "test") {
    const raw = getTemplateContentSync(templateKey);
    html = replaceVars(raw, variables, true);
  } else {
    html = `<p>This is a test email. If you received this, your SMTP configuration is working.</p>`;
  }

  const textFn = TEMPLATE_TEXT_FALLBACK[templateKey];
  const text = textFn ? textFn(variables) : html.replace(/<[^>]+>/g, "").trim();

  return { subject, html, text };
}

/**
 * Render with override resolution: agency override → system override → filesystem.
 * Used when sending emails so DB overrides are applied.
 */
export async function renderTemplateWithOverrides(
  templateKey: EmailTemplateKey,
  variables: Record<string, string>,
  agencyId?: string | null
): Promise<RenderedEmail> {
  const override = await findTemplateOverride(templateKey, agencyId);
  if (override) {
    return {
      subject: replaceVars(override.subject, variables, false),
      html: replaceVars(override.htmlBody, variables, true),
      text: override.textBody ? replaceVars(override.textBody, variables, false) : replaceVars(override.htmlBody, variables, false).replace(/<[^>]+>/g, "").trim(),
    };
  }
  return renderTemplate(templateKey, variables);
}
