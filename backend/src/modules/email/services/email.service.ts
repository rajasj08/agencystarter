import type { EmailSenderConfig } from "../types/email-sender-config.js";
import type { SendEmailOptions } from "../types/email-template.js";
import { resolveEmailSender } from "./sender-resolver.js";
import { renderTemplateWithOverrides } from "./email.renderer.js";
import { getCachedTransporter } from "./transport-cache.js";
import { logEmail } from "./email-log.js";
import { logger } from "../../../utils/logger.js";
import { agencyRepository } from "../../../lib/data-access.js";
import { env } from "../../../config/env.js";

export interface SendRawOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  agencyId?: string | null;
}

async function sendWithSender(
  sender: EmailSenderConfig,
  to: string,
  subject: string,
  html: string,
  text?: string,
  logMeta?: { template: string; agencyId?: string | null }
): Promise<boolean> {
  const from =
    sender.fromName && sender.fromName.trim()
      ? `"${sender.fromName.replace(/"/g, '\\"')}" <${sender.fromEmail}>`
      : sender.fromEmail;

  if (!sender.host || sender.host === "localhost") {
    logger.info("[email] (no SMTP) would send", { to, subject });
    if (logMeta) {
      await logEmail({ template: logMeta.template, recipient: to, agencyId: logMeta.agencyId ?? undefined, status: "skipped" });
    }
    return true;
  }

  const transport = getCachedTransporter(sender);
  try {
    await transport.sendMail({
      from,
      to,
      subject,
      html,
      text,
      replyTo: sender.replyTo ?? undefined,
    });
    logger.debug("Email sent", { to, subject });
    if (logMeta) {
      await logEmail({ template: logMeta.template, recipient: to, agencyId: logMeta.agencyId ?? undefined, status: "sent" });
    }
    return true;
  } catch (err) {
    logger.error("Email send failed", { to, subject });
    const message = err instanceof Error ? err.message : String(err);
    if (logMeta) {
      await logEmail({ template: logMeta.template, recipient: to, agencyId: logMeta.agencyId ?? undefined, status: "failed", error: message });
    }
    throw err;
  }
}

/**
 * Central email send: resolve sender (agency or system), render template, send.
 * Organization name in templates: use {{organizationName}}. It is always set:
 * - When agencyId is set: organizationName (and appName) = agency's name.
 * - When system sends (no agencyId): organizationName = appName from variables or env.APP_NAME (platform name).
 * SMTP passwords are never logged. Transport is cached per sender; sends are logged to email_logs.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { template, to, agencyId, variables } = options;
  let mergedVariables = { ...variables };
  if (agencyId) {
    const agency = await agencyRepository.findById(agencyId);
    const organizationName = agency?.name ?? "";
    mergedVariables = { ...mergedVariables, appName: organizationName, organizationName };
  } else {
    const appName = mergedVariables.appName ?? env.APP_NAME ?? "";
    mergedVariables = { ...mergedVariables, appName, organizationName: appName };
  }
  const sender = await resolveEmailSender(agencyId);
  const { subject, html, text } = await renderTemplateWithOverrides(template, mergedVariables, agencyId);
  return sendWithSender(sender, to, subject, html, text, {
    template,
    agencyId,
  });
}

/**
 * Send email with raw subject/html/text (no template). Uses same sender resolution as sendEmail.
 */
export async function sendRaw(options: SendRawOptions): Promise<boolean> {
  const sender = await resolveEmailSender(options.agencyId);
  return sendWithSender(
    sender,
    options.to,
    options.subject,
    options.html,
    options.text,
    { template: "raw", agencyId: options.agencyId }
  );
}
