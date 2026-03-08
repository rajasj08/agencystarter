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
  listSystemOverrides,
  type EmailTemplateKey,
  type EmailTemplateOverrideListItem,
} from "@/services/emailTemplates";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";
import { Pencil, Mail, RotateCcw } from "lucide-react";

const TEMPLATE_LABELS: Record<string, string> = {
  verification: "Email verification",
  "password-reset": "Password reset (user)",
  "password-reset-admin": "Password reset (admin)",
  invitation: "User invitation",
};

export default function SuperadminEmailTemplatesPage() {
  const [keys, setKeys] = useState<EmailTemplateKey[]>([]);
  const [overrides, setOverrides] = useState<EmailTemplateOverrideListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listEditableKeys("superadmin"), listSystemOverrides()])
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
    <PageContainer title="Email Templates" description="System-wide email template overrides. When no override is set, the default filesystem template is used.">
      <AppCard className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Scope</TableHead>
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
                    {override?.subject ?? "— Default —"}
                  </TableCell>
                  <TableCell>System</TableCell>
                  <TableCell>
                    {override ? (override.enabled ? "Enabled" : "Disabled") : "Default"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AppButton variant="outline" size="sm" asChild>
                        <Link href={ROUTES.SUPERADMIN_EMAIL_TEMPLATE_EDIT(key)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </AppButton>
                    </div>
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
