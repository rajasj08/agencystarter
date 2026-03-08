import { z } from "zod";
import { EDITABLE_TEMPLATE_KEYS } from "./email-template.constants.js";

const templateKeySchema = z.enum(EDITABLE_TEMPLATE_KEYS as unknown as [string, ...string[]]);

export const getTemplateParamsSchema = z.object({
  key: templateKeySchema,
});

export const updateTemplateBodySchema = z.object({
  subject: z.string().min(1).max(500),
  htmlBody: z.string().min(1),
  textBody: z.string().max(10000).optional().nullable(),
  enabled: z.boolean().optional(),
});

export const previewBodySchema = z.object({
  templateKey: templateKeySchema,
  agencyId: z.string().cuid().optional().nullable(),
  variables: z.record(z.string()).optional().default({}),
});

export const testEmailBodySchema = z.object({
  templateKey: templateKeySchema,
  email: z.string().email(),
});

export type GetTemplateParams = z.infer<typeof getTemplateParamsSchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;
export type PreviewBody = z.infer<typeof previewBodySchema>;
export type TestEmailBody = z.infer<typeof testEmailBodySchema>;
