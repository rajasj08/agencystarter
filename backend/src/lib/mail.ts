import path from "node:path";
import fs from "node:fs";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== null) return transporter;
  if (!env.SMTP_HOST) {
    logger.debug("SMTP not configured; emails will be logged only");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
  return transporter;
}

const TEMPLATES_DIR = path.join(process.cwd(), "templates", "emails");

function loadTemplate(name: string): string {
  const filePath = path.join(TEMPLATES_DIR, `${name}.html`);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    logger.warn(`Email template not found: ${name}`, { path: filePath });
    return "";
  }
}

function render(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{${key}}}`, "g"), value ?? "");
  }
  return out;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: SendMailOptions): Promise<boolean> {
  const transport = getTransporter();
  const from = `"${env.APP_NAME}" <${env.SMTP_FROM}>`;
  if (!transport) {
    logger.info("[mail] (no SMTP) would send", {
      to: options.to,
      subject: options.subject,
    });
    return true;
  }
  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.debug("Email sent", { to: options.to, subject: options.subject });
    return true;
  } catch (err) {
    logger.error("Email send failed", err);
    return false;
  }
}

export function renderTemplate(
  name: string,
  vars: Record<string, string>
): string {
  const template = loadTemplate(name);
  return render(template, vars);
}

export async function sendVerificationEmail(
  to: string,
  userName: string | null,
  verificationLink: string
): Promise<boolean> {
  const html = renderTemplate("verification", {
    appName: env.APP_NAME,
    userName: userName ?? "there",
    verificationLink,
  });
  const subject = `Verify your email – ${env.APP_NAME}`;
  return sendMail({
    to,
    subject,
    html,
    text: `Hi ${userName ?? "there"},\n\nPlease verify your email by opening this link:\n${verificationLink}\n\n— ${env.APP_NAME}`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  userName: string | null,
  resetLink: string,
  expiryMinutes: string
): Promise<boolean> {
  const html = renderTemplate("password-reset", {
    appName: env.APP_NAME,
    userName: userName ?? "there",
    resetLink,
    expiryMinutes,
  });
  const subject = `Reset your password – ${env.APP_NAME}`;
  return sendMail({
    to,
    subject,
    html,
    text: `Hi ${userName ?? "there"},\n\nReset your password by opening this link (valid for ${expiryMinutes} minutes):\n${resetLink}\n\n— ${env.APP_NAME}`,
  });
}
