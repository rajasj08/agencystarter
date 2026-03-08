/**
 * Resolved SMTP sender configuration used to create a nodemailer transport and set From header.
 * Never log or expose password.
 */
export interface EmailSenderConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string | null;
}
