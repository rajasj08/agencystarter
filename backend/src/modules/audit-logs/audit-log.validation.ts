import { z } from "zod";

const exportMaxLimit = 10_000;

export const auditExportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  from: z.string().optional().nullable().or(z.literal("")),
  to: z.string().optional().nullable().or(z.literal("")),
  action: z.string().max(100).optional().nullable().or(z.literal("")),
  userId: z.string().max(100).optional().nullable().or(z.literal("")),
  resource: z.string().max(100).optional().nullable().or(z.literal("")),
  limit: z.coerce.number().int().min(1).max(exportMaxLimit).default(1000),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AuditExportQuery = z.infer<typeof auditExportQuerySchema>;
