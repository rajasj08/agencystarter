import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z.string().max(200).optional().nullable(),
  permissionKeys: z.array(z.string().min(1)).min(1, "At least one permission is required"),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
