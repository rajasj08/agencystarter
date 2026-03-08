/**
 * Template key used when calling sendEmail. Maps to a physical template file and subject.
 */
export type EmailTemplateKey =
  | "verification"
  | "password-reset"
  | "password-reset-admin"
  | "invitation"
  | "test";

export interface SendEmailOptions {
  template: EmailTemplateKey;
  to: string;
  /** When set, agency SMTP is used if configured; otherwise system SMTP. Omit for system-only (e.g. verification). */
  agencyId?: string | null;
  variables: Record<string, string>;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
