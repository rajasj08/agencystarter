import { z } from "zod";

export const createAgencySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
