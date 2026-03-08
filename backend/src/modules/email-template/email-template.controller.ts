import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/auth.js";
import type { EmailTemplateKey } from "../email/types/email-template.js";
import { EmailTemplateService } from "./email-template.service.js";
import { getTemplateParamsSchema, updateTemplateBodySchema, previewBodySchema, testEmailBodySchema } from "./email-template.validation.js";

const service = new EmailTemplateService();

function asTemplateKey(key: string): EmailTemplateKey {
  return key as EmailTemplateKey;
}

/** Superadmin: list system overrides. */
export async function listSystemOverrides(_req: Request, res: Response): Promise<void> {
  const data = await service.listOverrides({ systemOnly: true });
  res.json({ success: true, data });
}

/** Agency: list overrides for current tenant. */
export async function listAgencyOverrides(req: AuthRequest, res: Response): Promise<void> {
  const agencyId = req.user?.agencyId;
  if (!agencyId) {
    res.status(403).json({ success: false, code: "FORBIDDEN", message: "Agency context required" });
    return;
  }
  const data = await service.listOverrides({ agencyId });
  res.json({ success: true, data });
}

/** Superadmin: get one override by key. */
export async function getSystemOverride(req: Request, res: Response): Promise<void> {
  const parsed = getTemplateParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  const data = await service.getOverride(asTemplateKey(parsed.data.key), { systemOnly: true });
  if (!data) {
    res.status(404).json({ success: false, code: "NOT_FOUND", message: "Template override not found" });
    return;
  }
  res.json({ success: true, data });
}

/** Agency: get one override by key. */
export async function getAgencyOverride(req: AuthRequest, res: Response): Promise<void> {
  const agencyId = req.user?.agencyId;
  if (!agencyId) {
    res.status(403).json({ success: false, code: "FORBIDDEN", message: "Agency context required" });
    return;
  }
  const parsed = getTemplateParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  const data = await service.getOverride(asTemplateKey(parsed.data.key), { agencyId });
  if (!data) {
    res.status(404).json({ success: false, code: "NOT_FOUND", message: "Template override not found" });
    return;
  }
  res.json({ success: true, data });
}

/** Superadmin: upsert override. */
export async function upsertSystemOverride(req: Request, res: Response): Promise<void> {
  const paramParsed = getTemplateParamsSchema.safeParse(req.params);
  const bodyParsed = updateTemplateBodySchema.safeParse(req.body);
  if (!paramParsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: paramParsed.error.message });
    return;
  }
  if (!bodyParsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: bodyParsed.error.message });
    return;
  }
  const data = await service.upsertOverride(asTemplateKey(paramParsed.data.key), bodyParsed.data, { systemOnly: true });
  res.json({ success: true, data });
}

/** Agency: upsert override. */
export async function upsertAgencyOverride(req: AuthRequest, res: Response): Promise<void> {
  const agencyId = req.user?.agencyId;
  if (!agencyId) {
    res.status(403).json({ success: false, code: "FORBIDDEN", message: "Agency context required" });
    return;
  }
  const paramParsed = getTemplateParamsSchema.safeParse(req.params);
  const bodyParsed = updateTemplateBodySchema.safeParse(req.body);
  if (!paramParsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: paramParsed.error.message });
    return;
  }
  if (!bodyParsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: bodyParsed.error.message });
    return;
  }
  const data = await service.upsertOverride(asTemplateKey(paramParsed.data.key), bodyParsed.data, { agencyId });
  res.json({ success: true, data });
}

/** Superadmin: delete override. */
export async function deleteSystemOverride(req: Request, res: Response): Promise<void> {
  const parsed = getTemplateParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  await service.deleteOverride(asTemplateKey(parsed.data.key), { systemOnly: true });
  res.status(204).send();
}

/** Agency: delete override. */
export async function deleteAgencyOverride(req: AuthRequest, res: Response): Promise<void> {
  const agencyId = req.user?.agencyId;
  if (!agencyId) {
    res.status(403).json({ success: false, code: "FORBIDDEN", message: "Agency context required" });
    return;
  }
  const parsed = getTemplateParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  await service.deleteOverride(asTemplateKey(parsed.data.key), { agencyId });
  res.status(204).send();
}

/** Get variables for template key (shared). */
export async function getVariables(req: Request, res: Response): Promise<void> {
  const parsed = getTemplateParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  const variables = service.getVariablesForTemplate(parsed.data.key);
  res.json({ success: true, data: { variables } });
}

/** Preview rendered template (shared). */
export async function preview(req: Request, res: Response): Promise<void> {
  const parsed = previewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  const data = await service.preview(parsed.data);
  res.json({ success: true, data });
}

/** Send test email (agencyId from auth when in tenant context). */
export async function sendTest(req: AuthRequest, res: Response): Promise<void> {
  const parsed = testEmailBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  await service.sendTestEmail(parsed.data, req.user?.agencyId ?? undefined);
  res.json({ success: true, data: { message: "Test email sent." } });
}

/** Get default (filesystem) content for the editor. Same raw template for superadmin and agency; both use {{organizationName}} for organization name. */
export async function getDefaultContent(req: Request, res: Response): Promise<void> {
  const parsed = getTemplateParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: parsed.error.message });
    return;
  }
  const data = service.getDefaultContent(asTemplateKey(parsed.data.key));
  res.json({ success: true, data });
}

/** List editable template keys (shared). */
export async function listEditableKeys(_req: Request, res: Response): Promise<void> {
  const data = service.getEditableKeys();
  res.json({ success: true, data: { keys: data } });
}
