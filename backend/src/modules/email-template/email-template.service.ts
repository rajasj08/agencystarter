import { getPrismaForInternalUse } from "../../lib/data-access.js";
import { env } from "../../config/env.js";
import type { EmailTemplateKey } from "../email/types/email-template.js";
import { getRawTemplateContent, renderTemplate, renderTemplateWithOverrides } from "../email/services/email.renderer.js";
import { dispatchEmail } from "../email/index.js";
import { EDITABLE_TEMPLATE_KEYS, TEMPLATE_VARIABLES, getSampleVariables } from "./email-template.constants.js";
import type { UpdateTemplateBody, PreviewBody, TestEmailBody } from "./email-template.validation.js";

export class EmailTemplateService {
  /** List overrides: superadmin = all (system + any agency), agency = only that agency. */
  async listOverrides(scope: { systemOnly: true } | { agencyId: string }) {
    const prisma = getPrismaForInternalUse();
    if ("systemOnly" in scope && scope.systemOnly) {
      const rows = await prisma.emailTemplateOverride.findMany({
        where: { agencyId: null },
        orderBy: { templateKey: "asc" },
      });
      return rows.map((r) => ({
        id: r.id,
        templateKey: r.templateKey,
        agencyId: r.agencyId,
        subject: r.subject,
        enabled: r.enabled,
        updatedAt: r.updatedAt,
      }));
    }
    const agencyId = (scope as { agencyId: string }).agencyId;
    const rows = await prisma.emailTemplateOverride.findMany({
      where: { agencyId },
      orderBy: { templateKey: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      templateKey: r.templateKey,
      agencyId: r.agencyId,
      subject: r.subject,
      enabled: r.enabled,
      updatedAt: r.updatedAt,
    }));
  }

  /** Get one override by template key. */
  async getOverride(
    templateKey: EmailTemplateKey,
    scope: { systemOnly: true } | { agencyId: string }
  ) {
    const prisma = getPrismaForInternalUse();
    const agencyId = "agencyId" in scope ? scope.agencyId : null;
    const row = await prisma.emailTemplateOverride.findFirst({
      where: { templateKey, agencyId },
    });
    if (!row) return null;
    return {
      id: row.id,
      templateKey: row.templateKey,
      agencyId: row.agencyId,
      subject: row.subject,
      htmlBody: row.htmlBody,
      textBody: row.textBody,
      enabled: row.enabled,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /** Create or update override. */
  async upsertOverride(
    templateKey: EmailTemplateKey,
    body: UpdateTemplateBody,
    scope: { systemOnly: true } | { agencyId: string }
  ) {
    const prisma = getPrismaForInternalUse();
    const agencyId = "agencyId" in scope ? scope.agencyId : null;
    const existing = await prisma.emailTemplateOverride.findFirst({
      where: { templateKey, agencyId },
    });
    const row = existing
      ? await prisma.emailTemplateOverride.update({
          where: { id: existing.id },
          data: {
            subject: body.subject,
            htmlBody: body.htmlBody,
            textBody: body.textBody ?? undefined,
            ...(body.enabled !== undefined && { enabled: body.enabled }),
          },
        })
      : await prisma.emailTemplateOverride.create({
          data: {
            templateKey,
            agencyId,
            subject: body.subject,
            htmlBody: body.htmlBody,
            textBody: body.textBody ?? null,
            enabled: body.enabled ?? true,
          },
        });
    return {
      id: row.id,
      templateKey: row.templateKey,
      agencyId: row.agencyId,
      subject: row.subject,
      htmlBody: row.htmlBody,
      textBody: row.textBody,
      enabled: row.enabled,
      updatedAt: row.updatedAt,
    };
  }

  /** Delete override (revert to filesystem). */
  async deleteOverride(
    templateKey: EmailTemplateKey,
    scope: { systemOnly: true } | { agencyId: string }
  ) {
    const prisma = getPrismaForInternalUse();
    const agencyId = "agencyId" in scope ? scope.agencyId : null;
    await prisma.emailTemplateOverride.deleteMany({
      where: { templateKey, agencyId },
    });
  }

  /** Get variable names for a template. */
  getVariablesForTemplate(templateKey: string): string[] {
    return TEMPLATE_VARIABLES[templateKey] ?? [];
  }

  /** Preview: render with optional override (agency or system) and variables. */
  async preview(body: PreviewBody) {
    const variables = { ...getSampleVariables(env.CORS_ORIGIN), ...body.variables };
    const result = await renderTemplateWithOverrides(
      body.templateKey as EmailTemplateKey,
      variables,
      body.agencyId ?? undefined
    );
    return result;
  }

  /** Send test email using sample variables (links point to app frontend). */
  async sendTestEmail(body: TestEmailBody, agencyId?: string | null) {
    const variables = getSampleVariables(env.CORS_ORIGIN);
    await dispatchEmail({
      template: body.templateKey as EmailTemplateKey,
      to: body.email,
      agencyId: agencyId ?? undefined,
      variables,
    });
    return { sent: true, message: "Test email sent." };
  }

  /** Default (filesystem) template content for the editor: raw subject + HTML with {{variables}} (e.g. {{organizationName}}). No substitution. */
  getDefaultContent(templateKey: EmailTemplateKey) {
    const raw = getRawTemplateContent(templateKey);
    return { subject: raw.subject, html: raw.html, text: null };
  }

  getEditableKeys(): EmailTemplateKey[] {
    return [...EDITABLE_TEMPLATE_KEYS];
  }
}
