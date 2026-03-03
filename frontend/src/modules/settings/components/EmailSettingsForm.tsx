"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput, FormCheckbox } from "@/components/forms";
import { AppButton } from "@/components/design";
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
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-medium text-text-primary mb-2">SMTP</h2>
        <p className="text-sm text-text-secondary mb-4">
          Configure the SMTP server used to send emails (verification, password reset, etc.).
        </p>
        <FormProviderWrapper form={form as never} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormInput name="smtpHost" label="Host" placeholder="smtp.example.com" />
          <FormInput name="smtpPort" label="Port" type="number" placeholder="587" helperText="Usually 587 (TLS) or 465 (SSL)." />
          <FormInput name="smtpUsername" label="Username" />
          <FormInput name="smtpPassword" label="Password" type="password" helperText="Leave blank to keep existing." />
          <FormInput name="senderName" label="Sender name" placeholder="Agency Name" />
          <FormInput name="senderEmail" label="Sender email" type="email" placeholder="noreply@example.com" />
          <h3 className="text-base font-medium text-text-primary pt-2">Email features</h3>
          <FormCheckbox name="enableEmails" label="Enable emails" helperText="Master switch for sending emails." />
          <FormCheckbox name="enableVerificationEmails" label="Enable verification emails" />
          <FormCheckbox name="enableResetEmails" label="Enable reset emails" />
          <AppButton type="submit" loading={saving} disabled={saving}>
            Save email settings
          </AppButton>
        </FormProviderWrapper>
      </section>

      <section>
        <h2 className="text-lg font-medium text-text-primary mb-2">Test email</h2>
        <p className="text-sm text-text-secondary mb-4">Send a test email to verify your SMTP configuration.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="test-email-to" className="block text-sm font-medium text-text-primary mb-1">
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
      </section>
    </div>
  );
}
