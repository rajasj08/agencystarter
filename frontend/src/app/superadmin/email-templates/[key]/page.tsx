"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmailTemplateEditor } from "@/modules/email-templates/components/EmailTemplateEditor";
import {
  getSystemOverride,
  upsertSystemOverride,
  deleteSystemOverride,
  getDefaultContent,
  extractBodyHtml,
  type UpdateTemplateBody,
} from "@/services/emailTemplates";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";

const TEMPLATE_LABELS: Record<string, string> = {
  verification: "Email verification",
  "password-reset": "Password reset (user)",
  "password-reset-admin": "Password reset (admin)",
  invitation: "User invitation",
};

export default function SuperadminEmailTemplateEditPage() {
  const params = useParams();
  const key = typeof params.key === "string" ? params.key : "";
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOverride, setIsOverride] = useState(false);

  useEffect(() => {
    if (!key) return;
    getSystemOverride(key)
      .then((override) => {
        if (override) {
          setSubject(override.subject);
          setHtmlBody(override.htmlBody);
          setTextBody(override.textBody);
          setIsOverride(true);
        } else {
          getDefaultContent("superadmin", key).then((defaultContent) => {
            setSubject(defaultContent.subject);
            setHtmlBody(extractBodyHtml(defaultContent.html));
            setTextBody(defaultContent.text);
            setIsOverride(false);
          });
        }
      })
      .catch(() => toast.error("Failed to load template"))
      .finally(() => setLoading(false));
  }, [key]);

  if (!key || loading) {
    return (
      <PageContainer title="Email Template">
        <p className="text-text-secondary">Loading…</p>
      </PageContainer>
    );
  }

  const handleSave = async (body: UpdateTemplateBody) => {
    await upsertSystemOverride(key, body);
    setIsOverride(true);
  };

  const handleDelete = async () => {
    await deleteSystemOverride(key);
  };

  return (
    <PageContainer
      title={TEMPLATE_LABELS[key] ?? key}
      description="System override. When saved, this content is used for all agencies unless they set their own override."
    >
      <EmailTemplateEditor
        base="superadmin"
        templateKey={key}
        backHref={ROUTES.SUPERADMIN_EMAIL_TEMPLATES}
        initialSubject={subject}
        initialHtmlBody={htmlBody}
        initialTextBody={textBody}
        onSave={handleSave}
        onDelete={isOverride ? handleDelete : undefined}
      />
    </PageContainer>
  );
}
