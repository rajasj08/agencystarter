"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormCheckbox, FormSelect } from "@/components/forms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettingsDTO,
  type SystemSettingsUpdateInput,
} from "@/services/superadmin";
import { toast } from "@/lib/toast";

const schema = z.object({
  allowRegistration: z.boolean(),
  emailVerificationRequired: z.boolean(),
  maintenanceMessage: z.string().max(500).nullable(),
  defaultTheme: z.string().max(50),
  allowAgencyRegistration: z.boolean(),
  maxUsersPerAgency: z.number().int().min(0).nullable(),
  defaultTimezone: z.string().max(50),
  maintenanceMode: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const timezoneOptions = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
].map((v) => ({ value: v, label: v }));

export default function SuperadminSystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowRegistration: true,
      emailVerificationRequired: false,
      maintenanceMessage: null,
      defaultTheme: "light",
      allowAgencyRegistration: true,
      maxUsersPerAgency: null,
      defaultTimezone: "UTC",
      maintenanceMode: false,
    },
  });

  useEffect(() => {
    getSystemSettings()
      .then((data: SystemSettingsDTO) => {
        form.reset({
          allowRegistration: data.allowRegistration,
          emailVerificationRequired: data.emailVerificationRequired,
          maintenanceMessage: data.maintenanceMessage,
          defaultTheme: data.defaultTheme,
          allowAgencyRegistration: data.allowAgencyRegistration,
          maxUsersPerAgency: data.maxUsersPerAgency,
          defaultTimezone: data.defaultTimezone,
          maintenanceMode: data.maintenanceMode,
        });
      })
      .catch(() => toast.error("Failed to load system settings"))
      .finally(() => setLoading(false));
  }, [form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const payload: SystemSettingsUpdateInput = {
        allowRegistration: values.allowRegistration,
        emailVerificationRequired: values.emailVerificationRequired,
        maintenanceMessage: values.maintenanceMessage,
        defaultTheme: values.defaultTheme,
        allowAgencyRegistration: values.allowAgencyRegistration,
        maxUsersPerAgency: values.maxUsersPerAgency ?? null,
        defaultTimezone: values.defaultTimezone,
        maintenanceMode: values.maintenanceMode,
      };
      await updateSystemSettings(payload);
      toast.success("System settings saved.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="System Settings">
        <p className="text-text-secondary">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="System Settings">
      <AppCard className="max-w-2xl rounded-xl">
        <FormProviderWrapper form={form as never} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <section>
            <h2 className="text-base font-medium text-text-primary mb-3">Registration</h2>
            <div className="space-y-3">
              <FormCheckbox name="allowRegistration" label="Allow user registration" />
              <FormCheckbox name="allowAgencyRegistration" label="Allow agency registration (onboarding)" />
              <FormCheckbox name="emailVerificationRequired" label="Require email verification" />
            </div>
          </section>
          <section>
            <h2 className="text-base font-medium text-text-primary mb-3">Limits & defaults</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                name="maxUsersPerAgency"
                label="Max users per agency"
                type="number"
                helperText="Leave empty for no limit"
              />
              <FormSelect name="defaultTimezone" label="Default timezone" options={timezoneOptions} />
            </div>
          </section>
          <section>
            <h2 className="text-base font-medium text-text-primary mb-3">Maintenance</h2>
            <div className="space-y-3">
              <FormCheckbox name="maintenanceMode" label="Maintenance mode" helperText="When on, show maintenance message" />
              <FormInput name="maintenanceMessage" label="Maintenance message" />
              <FormInput name="defaultTheme" label="Default theme" />
            </div>
          </section>
          <AppButton type="submit" loading={saving} disabled={saving}>
            Save system settings
          </AppButton>
        </FormProviderWrapper>
      </AppCard>
    </PageContainer>
  );
}
