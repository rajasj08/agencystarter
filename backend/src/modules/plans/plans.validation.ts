import { z } from "zod";

/** Features JSON shape: e.g. { reports: true, auditLogs: true } */
export const planFeaturesSchema = z.record(z.string(), z.boolean()).default({});

export const createPlanSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    code: z.string().min(1, "Code is required").max(50).regex(/^[A-Z0-9_]+$/, "Code: uppercase letters, numbers, underscores only"),
    description: z.string().max(1000).nullable().optional(),
    price: z.number().int().min(0),
    maxUsers: z.number().int().min(-1), // -1 = unlimited
    maxLocations: z.number().int().min(-1),
    maxFacilities: z.number().int().min(-1),
    maxEmployees: z.number().int().min(-1),
    features: planFeaturesSchema.optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    isCustom: z.boolean().nullable().optional(),
  })
  .strict();

/** Code cannot be modified after creation; omit from update. */
export const updatePlanSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    price: z.number().int().min(0).optional(),
    maxUsers: z.number().int().min(-1).optional(),
    maxLocations: z.number().int().min(-1).optional(),
    maxFacilities: z.number().int().min(-1).optional(),
    maxEmployees: z.number().int().min(-1).optional(),
    features: planFeaturesSchema.optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    isCustom: z.boolean().nullable().optional(),
  })
  .strict();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
