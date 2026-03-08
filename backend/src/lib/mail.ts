import { env } from "../config/env.js";
import { dispatchEmail, sendRaw } from "../modules/email/index.js";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send raw email (subject/html/text). Uses system SMTP when agencyId is omitted.
 * @deprecated Prefer dispatchEmail from @/modules/email with template and variables.
 */
export async function sendMail(options: SendMailOptions): Promise<boolean> {
  return sendRaw({
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    agencyId: undefined,
  });
}

/** Re-export for callers that need to render a template without sending. */
export { renderTemplate } from "../modules/email/index.js";

export async function sendVerificationEmail(
  to: string,
  userName: string | null,
  verificationLink: string
): Promise<boolean> {
  return dispatchEmail({
    template: "verification",
    to,
    agencyId: undefined,
    variables: {
      appName: env.APP_NAME ?? "",
      userName: userName ?? "there",
      verificationLink,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  userName: string | null,
  resetLink: string,
  expiryMinutes: string,
  agencyId?: string | null
): Promise<boolean> {
  return dispatchEmail({
    template: "password-reset",
    to,
    agencyId: agencyId ?? undefined,
    variables: {
      appName: env.APP_NAME ?? "",
      userName: userName ?? "there",
      resetLink,
      expiryMinutes,
    },
  });
}

/** Password reset email when sent by an admin (e.g. from edit user page). Uses different copy than user-initiated reset. */
export async function sendPasswordResetByAdminEmail(
  to: string,
  userName: string | null,
  resetLink: string,
  expiryMinutes: string,
  agencyId?: string | null
): Promise<boolean> {
  return dispatchEmail({
    template: "password-reset-admin",
    to,
    agencyId: agencyId ?? undefined,
    variables: {
      appName: env.APP_NAME ?? "",
      userName: userName ?? "there",
      resetLink,
      expiryMinutes,
    },
  });
}

/** Invitation email when an admin creates a user with "Send invitation". Welcome copy, not password-reset copy. */
export async function sendUserInvitationEmail(
  to: string,
  userName: string | null,
  setPasswordLink: string,
  expiryDisplay: string,
  agencyId?: string | null
): Promise<boolean> {
  return dispatchEmail({
    template: "invitation",
    to,
    agencyId: agencyId ?? undefined,
    variables: {
      appName: env.APP_NAME ?? "",
      userName: userName ?? "there",
      setPasswordLink,
      expiryDisplay,
    },
  });
}
