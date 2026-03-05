import type { Prisma } from "@prisma/client";
import { settingsRepository as settingsRepo } from "../../lib/data-access.js";
import { BaseService } from "../../core/BaseService.js";
import { UPDATABLE_IDENTITY_KEYS } from "./settings.repository.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import type { UpdateSettingsInput } from "./settings.validation.js";
import { validateCidr } from "../../utils/cidr.js";
import nodemailer from "nodemailer";

const DEFAULTS: Record<string, unknown> = {
  timezone: "UTC",
  defaultLanguage: "en",
  dateFormat: "YYYY-MM-DD",
  currency: "USD",
  allowSelfRegistration: true,
  defaultUserRole: "user",
  requireAdminApproval: false,
  allowUserInvitations: true,
  enableEmails: true,
  enableVerificationEmails: true,
  enableResetEmails: true,
  theme: "system",
};

export class SettingsService extends BaseService {
  async get(agencyId: string): Promise<Record<string, unknown>> {
    const agency = await settingsRepo.getAgencyWithSettings(agencyId);
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
    const settingsObj =
      typeof agency.settings === "object" && agency.settings !== null
        ? (agency.settings as Record<string, unknown>)
        : {};
    const merged: Record<string, unknown> = {
      name: agency.name,
      slug: agency.slug,
      logo: agency.logo ?? null,
      websiteUrl: agency.websiteUrl ?? null,
      supportEmail: agency.supportEmail ?? null,
      supportPhone: agency.supportPhone ?? null,
      contactFirstName: agency.contactFirstName ?? null,
      contactLastName: agency.contactLastName ?? null,
      contactEmail: agency.contactEmail ?? null,
      contactPhone: agency.contactPhone ?? null,
      ...DEFAULTS,
      ...settingsObj,
    };
    // Never expose SMTP password to client
    if (Object.prototype.hasOwnProperty.call(merged, "smtpPassword")) {
      delete merged.smtpPassword;
    }
    return merged;
  }

  async update(agencyId: string, input: UpdateSettingsInput): Promise<Record<string, unknown>> {
    const agency = await settingsRepo.getAgencyWithSettings(agencyId);
    if (!agency) throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);

    const identity: Record<string, unknown> = {};
    const settingsUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (UPDATABLE_IDENTITY_KEYS.includes(key as (typeof UPDATABLE_IDENTITY_KEYS)[number])) {
        identity[key] = value === "" ? null : value;
      } else {
        settingsUpdates[key] = value === "" ? null : value;
      }
    }

    if (settingsUpdates.ipAllowlist !== undefined) {
      const list = settingsUpdates.ipAllowlist;
      if (Array.isArray(list)) {
        for (let i = 0; i < list.length; i++) {
          const entry = list[i];
          if (typeof entry !== "string" || !validateCidr(entry)) {
            throw new AppError(
              ERROR_CODES.VALIDATION_ERROR,
              `ipAllowlist[${i}]: invalid IPv4 CIDR (e.g. 192.168.1.0/24)`,
              400
            );
          }
        }
      } else if (list !== null && list !== "") {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "ipAllowlist must be an array of CIDR strings", 400);
      }
    }

    const currentSettings =
      typeof agency.settings === "object" && agency.settings !== null
        ? (agency.settings as Record<string, unknown>)
        : {};
    const mergedSettings = { ...currentSettings, ...settingsUpdates };

    await settingsRepo.updateAgencySettings(agencyId, identity as Parameters<typeof settingsRepo.updateAgencySettings>[1], mergedSettings as Prisma.JsonObject);

    return this.get(agencyId);
  }

  async sendTestEmail(agencyId: string, to: string): Promise<{ sent: boolean; message: string }> {
    const data = (await this.get(agencyId)) as Record<string, unknown>;
    const host = data.smtpHost as string | undefined;
    const port = Number(data.smtpPort) || 587;
    const user = data.smtpUsername as string | undefined;
    const pass = data.smtpPassword as string | undefined;
    const senderName = (data.senderName as string) || "Agency";
    const senderEmail = (data.senderEmail as string) || "noreply@example.com";

    if (!host?.trim()) {
      return { sent: false, message: "SMTP host is not configured." };
    }

    const transport = nodemailer.createTransport({
      host: host.trim(),
      port,
      secure: port === 465,
      auth: user && pass ? { user: user.trim(), pass } : undefined,
    });

    try {
      await transport.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject: "Test email from Agency Settings",
        text: "This is a test email. If you received this, your SMTP configuration is working.",
        html: "<p>This is a test email. If you received this, your SMTP configuration is working.</p>",
      });
      return { sent: true, message: "Test email sent successfully." };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send test email.";
      return { sent: false, message };
    }
  }
}
