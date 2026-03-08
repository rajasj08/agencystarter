import { api, type ApiSuccess } from "./api";

const SUPERADMIN_PREFIX = "/superadmin/email-templates";
const SETTINGS_PREFIX = "/settings/email-templates";

/**
 * Extract inner HTML of the first <body> from a full document.
 * Use when loading filesystem template HTML so the editor gets fragment-compatible content.
 * If no <body> is found, returns the original string.
 */
export function extractBodyHtml(html: string): string {
  if (typeof document === "undefined") {
    const bodyMatch = html.replace(/\s+/g, " ").match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1].trim() : html;
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  const body = div.querySelector("body");
  return body ? body.innerHTML.trim() : html;
}

export type EmailTemplateKey = "verification" | "password-reset" | "password-reset-admin" | "invitation";

export interface EmailTemplateOverrideListItem {
  id: string;
  templateKey: string;
  agencyId: string | null;
  subject: string;
  enabled: boolean;
  updatedAt: string;
}

export interface EmailTemplateOverrideDetail {
  id: string;
  templateKey: string;
  agencyId: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTemplateBody {
  subject: string;
  htmlBody: string;
  textBody?: string | null;
  enabled?: boolean;
}

export interface PreviewPayload {
  templateKey: EmailTemplateKey;
  agencyId?: string | null;
  variables?: Record<string, string>;
}

export interface RenderedPreview {
  subject: string;
  html: string;
  text: string;
}

export interface TestEmailPayload {
  templateKey: EmailTemplateKey;
  email: string;
}

// —— Superadmin (system) ——

export async function listSystemOverrides(): Promise<EmailTemplateOverrideListItem[]> {
  const res = await api.get<ApiSuccess<EmailTemplateOverrideListItem[]>>(SUPERADMIN_PREFIX);
  return res.data.data;
}

export async function getSystemOverride(key: string): Promise<EmailTemplateOverrideDetail | null> {
  try {
    const res = await api.get<ApiSuccess<EmailTemplateOverrideDetail>>(`${SUPERADMIN_PREFIX}/${key}`);
    return res.data.data;
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "response" in e) {
      const ax = (e as { response?: { status?: number } }).response;
      if (ax?.status === 404) return null;
    }
    throw e;
  }
}

export async function upsertSystemOverride(key: string, body: UpdateTemplateBody): Promise<EmailTemplateOverrideDetail> {
  const res = await api.put<ApiSuccess<EmailTemplateOverrideDetail>>(`${SUPERADMIN_PREFIX}/${key}`, body);
  return res.data.data;
}

export async function deleteSystemOverride(key: string): Promise<void> {
  await api.delete(`${SUPERADMIN_PREFIX}/${key}`);
}

// —— Agency (settings) ——

export async function listAgencyOverrides(): Promise<EmailTemplateOverrideListItem[]> {
  const res = await api.get<ApiSuccess<EmailTemplateOverrideListItem[]>>(SETTINGS_PREFIX);
  return res.data.data;
}

export async function getAgencyOverride(key: string): Promise<EmailTemplateOverrideDetail | null> {
  try {
    const res = await api.get<ApiSuccess<EmailTemplateOverrideDetail>>(`${SETTINGS_PREFIX}/${key}`);
    return res.data.data;
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "response" in e) {
      const ax = (e as { response?: { status?: number } }).response;
      if (ax?.status === 404) return null;
    }
    throw e;
  }
}

export async function upsertAgencyOverride(key: string, body: UpdateTemplateBody): Promise<EmailTemplateOverrideDetail> {
  const res = await api.put<ApiSuccess<EmailTemplateOverrideDetail>>(`${SETTINGS_PREFIX}/${key}`, body);
  return res.data.data;
}

export async function deleteAgencyOverride(key: string): Promise<void> {
  await api.delete(`${SETTINGS_PREFIX}/${key}`);
}

// —— Shared (same for both; use superadmin or settings prefix by caller) ——

export async function getVariables(base: "superadmin" | "settings", key: string): Promise<string[]> {
  const prefix = base === "superadmin" ? SUPERADMIN_PREFIX : SETTINGS_PREFIX;
  const res = await api.get<ApiSuccess<{ variables: string[] }>>(`${prefix}/${key}/variables`);
  return res.data.data.variables;
}

export async function getDefaultContent(base: "superadmin" | "settings", key: string): Promise<RenderedPreview> {
  const prefix = base === "superadmin" ? SUPERADMIN_PREFIX : SETTINGS_PREFIX;
  const res = await api.get<ApiSuccess<RenderedPreview>>(`${prefix}/${key}/default`);
  return res.data.data;
}

export async function preview(base: "superadmin" | "settings", payload: PreviewPayload): Promise<RenderedPreview> {
  const prefix = base === "superadmin" ? SUPERADMIN_PREFIX : SETTINGS_PREFIX;
  const res = await api.post<ApiSuccess<RenderedPreview>>(`${prefix}/preview`, payload);
  return res.data.data;
}

export async function sendTestEmail(base: "superadmin" | "settings", payload: TestEmailPayload): Promise<void> {
  const prefix = base === "superadmin" ? SUPERADMIN_PREFIX : SETTINGS_PREFIX;
  await api.post<ApiSuccess<{ message: string }>>(`${prefix}/test`, payload);
}

export async function listEditableKeys(base: "superadmin" | "settings"): Promise<EmailTemplateKey[]> {
  const prefix = base === "superadmin" ? SUPERADMIN_PREFIX : SETTINGS_PREFIX;
  const res = await api.get<ApiSuccess<{ keys: EmailTemplateKey[] }>>(`${prefix}/keys`);
  return res.data.data.keys;
}
