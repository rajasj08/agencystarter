"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormCheckbox } from "@/components/forms";
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
  allowAgencyRegistration: z.boolean(),
  emailVerificationRequired: z.boolean(),
  maxUsersPerAgency: z.number().int().min(0).nullable(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(500).nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function SuperadminSystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowRegistration: true,
      allowAgencyRegistration: true,
      emailVerificationRequired: false,
      maxUsersPerAgency: null,
      maintenanceMode: false,
      maintenanceMessage: null,
    },
  });

  useEffect(() => {
    getSystemSettings()
      .then((data: SystemSettingsDTO) => {
        form.reset({
          allowRegistration: data.allowRegistration,
          allowAgencyRegistration: data.allowAgencyRegistration,
          emailVerificationRequired: data.emailVerificationRequired,
          maxUsersPerAgency: data.maxUsersPerAgency,
          maintenanceMode: data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage,
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
        allowAgencyRegistration: values.allowAgencyRegistration,
        emailVerificationRequired: values.emailVerificationRequired,
        maxUsersPerAgency: values.maxUsersPerAgency ?? null,
        maintenanceMode: values.maintenanceMode,
        maintenanceMessage: values.maintenanceMessage,
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
        <FormProviderWrapper form={form as never} onSubmit={onSubmit} className="space-y-6">
          <section>
            <h2 className="text-base font-medium text-text-primary mb-3">Platform Access</h2>
            <div className="space-y-3">
              <FormCheckbox name="allowRegistration" label="Allow user registration" />
              <FormCheckbox name="allowAgencyRegistration" label="Allow agency registration (onboarding)" />
              <FormCheckbox name="emailVerificationRequired" label="Require email verification" />
            </div>
          </section>
          <section>
            <h2 className="text-base font-medium text-text-primary mb-3">Platform Limits</h2>
            <FormInput
              name="maxUsersPerAgency"
              label="Max users per agency"
              type="number"
              helperText="Leave empty for no limit"
            />
          </section>
          <section>
            <h2 className="text-base font-medium text-text-primary mb-3">Maintenance</h2>
            <div className="space-y-3">
              <FormCheckbox
                name="maintenanceMode"
                label="Enable maintenance mode"
                helperText="When on, show maintenance message to non–super-admins"
              />
              <FormInput name="maintenanceMessage" label="Maintenance message" />
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
