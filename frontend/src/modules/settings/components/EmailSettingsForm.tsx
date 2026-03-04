"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput } from "@/components/forms";
import { AppButton, ToggleSwitch } from "@/components/design";
import { getSettings, updateSettings, sendTestEmail } from "@/modules/settings/services/settingsService";
import type { AgencySettings } from "../types/settingsTypes";
import { toast } from "@/lib/toast";

const schema = z.object({
  smtpHost: z.string().max(255).optional().nullable(),
  smtpPort: z.number().int().min(1).max(65535).optional().nullable(),
  smtpUsername: z.string().max(255).optional().nullable(),
  smtpPassword: z.string().max(500).optional().nullable(),
  senderName: z.string().max(255).optional().nullable(),
  senderEmail: z.string().email().optional().or(z.literal("")),
  enableEmails: z.boolean(),
  enableVerificationEmails: z.boolean(),
  enableResetEmails: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function EmailSettingsForm() {
  const [initialData, setInitialData] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      senderName: "",
      senderEmail: "",
      enableEmails: true,
      enableVerificationEmails: true,
      enableResetEmails: true,
    },
  });

  useEffect(() => {
      getSettings()
      .then((data) => {
        setInitialData(data);
        const port = data.smtpPort;
        form.reset({
          smtpHost: data.smtpHost ?? "",
          smtpPort: typeof port === "number" ? port : port != null && port !== "" ? Number(port) : 587,
          smtpUsername: data.smtpUsername ?? "",
          smtpPassword: "",
          senderName: data.senderName ?? "",
          senderEmail: data.senderEmail ?? "",
          enableEmails: data.enableEmails ?? true,
          enableVerificationEmails: data.enableVerificationEmails ?? true,
          enableResetEmails: data.enableResetEmails ?? true,
        });
      })
      .catch(() => setInitialData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(values: FormValues) {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        smtpHost: values.smtpHost || null,
        smtpPort: values.smtpPort ?? null,
        smtpUsername: values.smtpUsername || null,
        senderName: values.senderName || null,
        senderEmail: values.senderEmail || null,
        enableEmails: values.enableEmails,
        enableVerificationEmails: values.enableVerificationEmails,
        enableResetEmails: values.enableResetEmails,
      };
      if (values.smtpPassword != null && String(values.smtpPassword).trim() !== "") {
        payload.smtpPassword = values.smtpPassword;
      }
      const updated = await updateSettings(payload);
      setInitialData(updated);
      toast.success("Email settings saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTest() {
    const to = testEmailTo.trim();
    if (!to) {
      toast.error("Enter an email address to send the test to.");
      return;
    }
    setSendingTest(true);
    try {
      await sendTestEmail(to);
      toast.success("Test email sent. Check the inbox for " + to);
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error)?.message ??
        "Failed to send test email.";
      toast.error(message);
    } finally {
      setSendingTest(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormProviderWrapper form={form as never} onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">SMTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="mb-4 text-sm text-text-secondary">
              Configure the SMTP server used to send emails (verification, password reset, etc.).
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput name="smtpHost" label="Host" placeholder="smtp.example.com" />
              <FormInput name="smtpPort" label="Port" type="number" placeholder="587" helperText="Usually 587 (TLS) or 465 (SSL)." />
              <FormInput name="smtpUsername" label="Username" />
              <FormInput name="smtpPassword" label="Password" type="password" helperText="Leave blank to keep existing." />
              <FormInput name="senderName" label="Sender name" placeholder="Agency Name" />
              <FormInput name="senderEmail" label="Sender email" type="email" placeholder="noreply@example.com" />
            </div>
          </CardContent>
        </Card>

        <div className="max-w-[50%] space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Email features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
              <div>
                <span className="text-sm font-medium text-text-primary">Enable emails</span>
                <p className="text-xs text-text-secondary">Master switch for sending emails.</p>
              </div>
              <ToggleSwitch id="enableEmails" {...form.register("enableEmails")} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
              <span className="text-sm text-text-primary">Enable verification emails</span>
              <ToggleSwitch id="enableVerificationEmails" {...form.register("enableVerificationEmails")} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
              <span className="text-sm text-text-primary">Enable reset emails</span>
              <ToggleSwitch id="enableResetEmails" {...form.register("enableResetEmails")} />
            </div>
          </CardContent>
        </Card>

        <AppButton type="submit" loading={saving} disabled={saving}>
          Save email settings
        </AppButton>
        </div>
      </FormProviderWrapper>

      <div className="max-w-[50%]">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Test email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="mb-4 text-sm text-text-secondary">Send a test email to verify your SMTP configuration.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="test-email-to" className="mb-1 block text-sm font-medium text-text-primary">
                Send test to
              </label>
              <input
                id="test-email-to"
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="you@example.com"
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <AppButton variant="outline" type="button" onClick={handleSendTest} loading={sendingTest} disabled={sendingTest}>
              Send test email
            </AppButton>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
