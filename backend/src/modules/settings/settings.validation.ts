import { z } from "zod";

/** Single flat schema for agency settings (identity + localization + user mgmt + SMTP + email features). */
export const agencySettingsSchema = z.object({
  // Agency identity (some stored on Agency table)
  name: z.string().min(1, "Agency name is required").max(255).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only").optional(),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  supportEmail: z.string().email().optional().nullable().or(z.literal("")),
  supportPhone: z.string().max(30).optional().nullable(),
  // Primary contact
  contactFirstName: z.string().max(100).optional().nullable(),
  contactLastName: z.string().max(100).optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  contactPhone: z.string().max(30).optional().nullable(),
  // Localization (mandatory section)
  timezone: z.string().max(50).optional().nullable(),
  defaultLanguage: z.string().max(10).optional().nullable(),
  dateFormat: z.string().max(30).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
  // User management
  allowSelfRegistration: z.boolean().optional(),
  defaultUserRole: z.string().max(50).optional().nullable(),
  requireAdminApproval: z.boolean().optional(),
  allowUserInvitations: z.boolean().optional(),
  // SMTP
  smtpHost: z.string().max(255).optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUsername: z.string().max(255).optional().nullable(),
  smtpPassword: z.string().max(500).optional().nullable(),
  senderName: z.string().max(255).optional().nullable(),
  senderEmail: z.string().email().optional().nullable().or(z.literal("")),
  // Email features
  enableEmails: z.boolean().optional(),
  enableVerificationEmails: z.boolean().optional(),
  enableResetEmails: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional().nullable(),
  /** Per-tenant IP allowlist: array of IPv4 CIDR strings (e.g. "192.168.1.0/24"). Empty = no restriction. */
  ipAllowlist: z
    .array(z.string().min(1).max(50))
    .max(100)
    .optional()
    .nullable(),
});

export type AgencySettingsInput = z.infer<typeof agencySettingsSchema>;

export const updateSettingsSchema = agencySettingsSchema.partial().strict();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const testEmailSchema = z.object({
  to: z.string().email("Valid email required"),
});
export type TestEmailInput = z.infer<typeof testEmailSchema>;
