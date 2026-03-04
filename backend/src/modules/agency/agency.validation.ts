import { z } from "zod";

export const createAgencySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

/** Tenant-level update: only fields AGENCY_ADMIN may change (no slug, planId, status). */
export const updateAgencyTenantSchema = z.object({
  name: z.string().min(1).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email().optional().or(z.literal("")),
  supportPhone: z.string().optional(),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
}).strict();

export type UpdateAgencyTenantInput = z.infer<typeof updateAgencyTenantSchema>;
