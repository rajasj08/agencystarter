"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listEditableKeys,
  listAgencyOverrides,
  type EmailTemplateKey,
  type EmailTemplateOverrideListItem,
} from "@/services/emailTemplates";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";
import { Pencil } from "lucide-react";

const TEMPLATE_LABELS: Record<string, string> = {
  verification: "Email verification",
  "password-reset": "Password reset (user)",
  "password-reset-admin": "Password reset (admin)",
  invitation: "User invitation",
};

export default function SettingsEmailTemplatesPage() {
  const [keys, setKeys] = useState<EmailTemplateKey[]>([]);
  const [overrides, setOverrides] = useState<EmailTemplateOverrideListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listEditableKeys("settings"), listAgencyOverrides()])
      .then(([k, o]) => {
        setKeys(k);
        setOverrides(o);
      })
      .catch(() => toast.error("Failed to load email templates"))
      .finally(() => setLoading(false));
  }, []);

  const overrideByKey = Object.fromEntries(overrides.map((o) => [o.templateKey, o]));

  if (loading) {
    return (
      <PageContainer title="Email Templates">
        <p className="text-text-secondary">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Email Templates"
      description="Override email templates for your organization. If no custom template is configured, the system template will be used."
    >
      <AppCard className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => {
              const override = overrideByKey[key];
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium">{TEMPLATE_LABELS[key] ?? key}</TableCell>
                  <TableCell className="max-w-[280px] truncate">
                    {override?.subject ?? "— System default —"}
                  </TableCell>
                  <TableCell>
                    {override ? (override.enabled ? "Custom" : "Disabled") : "Default"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AppButton variant="outline" size="sm" asChild>
                      <Link href={ROUTES.SETTINGS_EMAIL_TEMPLATE_EDIT(key)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </AppButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AppCard>
    </PageContainer>
  );
}
