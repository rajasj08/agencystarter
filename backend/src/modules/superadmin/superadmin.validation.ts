import { z } from "zod";

export const systemSettingsUpdateSchema = z
  .object({
    allowRegistration: z.boolean().optional(),
    emailVerificationRequired: z.boolean().optional(),
    maintenanceMessage: z.string().max(500).nullable().optional(),
    defaultTheme: z.string().max(50).optional(),
    allowAgencyRegistration: z.boolean().optional(),
    maxUsersPerAgency: z.number().int().min(0).nullable().optional(),
    defaultTimezone: z.string().max(50).optional(),
    maintenanceMode: z.boolean().optional(),
  })
  .strict();

export const impersonateSchema = z.object({
  agencyId: z.string().min(1, "agencyId is required"),
});

const agencyStatusSchema = z.enum(["ACTIVE", "DISABLED", "SUSPENDED", "DELETED"]);

export const updateAgencyStatusSchema = z.object({
  status: agencyStatusSchema,
});

// POST /superadmin/agencies: create agency + agency admin
const slugSchema = z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only");
export const createAgencySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: slugSchema,
    planId: z.string().min(1, "Plan is required"),
    adminEmail: z.string().email("Valid admin email is required"),
    adminPassword: z.string().min(8, "Password must be at least 8 characters"),
    adminName: z.string().max(200).optional(),
  })
  .strict();

// PATCH /superadmin/agencies/:id
export const updateAgencySchema = z
  .object({
    name: z.string().min(1).optional(),
    planId: z.string().nullable().optional(),
    status: agencyStatusSchema.optional(),
  })
  .strict();

// PATCH /superadmin/agencies/:id/plan
export const updateAgencyPlanSchema = z
  .object({
    planId: z.string().min(1, "Plan is required"),
  })
  .strict();

// GET /superadmin/users query
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["createdAt", "email", "role", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

// PATCH /superadmin/users/:id/role
export const setUserRoleSchema = z.object({
  role: z.enum(["AGENCY_ADMIN", "AGENCY_MEMBER", "USER"]),
});

// POST /superadmin/users: create user in an agency
export const createUserSchema = z
  .object({
    agencyId: z.string().min(1, "Agency is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["AGENCY_ADMIN", "AGENCY_MEMBER", "USER"]),
    name: z.string().max(200).optional(),
  })
  .strict();

export type SystemSettingsUpdateInput = z.infer<typeof systemSettingsUpdateSchema>;
export type ImpersonateInput = z.infer<typeof impersonateSchema>;
export type UpdateAgencyStatusInput = z.infer<typeof updateAgencyStatusSchema>;
export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
export type UpdateAgencyPlanInput = z.infer<typeof updateAgencyPlanSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
