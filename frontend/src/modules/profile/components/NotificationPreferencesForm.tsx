"use client";

import { useEffect } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { AppCard, AppButton } from "@/components/design";
import { Checkbox } from "@/components/ui/checkbox";
import type { UserPreferences } from "@/services/auth";

interface FormValues {
  emailNotifications: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  systemNotifications: boolean;
}

function PreferenceToggle({
  name,
  label,
}: {
  name: keyof FormValues;
  label: string;
}) {
  const { watch, setValue } = useFormContext<FormValues>();
  const value = watch(name);

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-sm">
      <span className="text-text-primary">{label}</span>
      <Checkbox
        checked={!!value}
        onChange={() => setValue(name, !value)}
        aria-label={label}
      />
    </label>
  );
}

export interface NotificationPreferencesFormProps {
  preferences: UserPreferences | null | undefined;
  onSubmit: (prefs: Partial<UserPreferences>) => void | Promise<void>;
  loading?: boolean;
}

export function NotificationPreferencesForm({
  preferences,
  onSubmit,
  loading = false,
}: NotificationPreferencesFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      emailNotifications: preferences?.emailNotifications ?? true,
      securityAlerts: preferences?.securityAlerts ?? true,
      marketingEmails: preferences?.marketingEmails ?? false,
      systemNotifications: preferences?.systemNotifications ?? true,
    },
  });

  useEffect(() => {
    if (preferences) {
      form.reset({
        emailNotifications: preferences.emailNotifications ?? true,
        securityAlerts: preferences.securityAlerts ?? true,
        marketingEmails: preferences.marketingEmails ?? false,
        systemNotifications: preferences.systemNotifications ?? true,
      });
    }
  }, [preferences?.emailNotifications, preferences?.securityAlerts, preferences?.marketingEmails, preferences?.systemNotifications]);

  return (
    <AppCard className="rounded-xl max-w-lg p-6">
      <h3 className="text-lg font-medium text-text-primary mb-2">Notification preferences</h3>
      <p className="text-sm text-text-secondary mb-6">
        Choose which notifications you want to receive.
      </p>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            onSubmit({
              emailNotifications: values.emailNotifications,
              securityAlerts: values.securityAlerts,
              marketingEmails: values.marketingEmails,
              systemNotifications: values.systemNotifications,
            })
          )}
          className="space-y-2"
        >
          <div className="divide-y divide-border">
            <PreferenceToggle name="emailNotifications" label="Email notifications" />
            <PreferenceToggle name="securityAlerts" label="Security alerts" />
            <PreferenceToggle name="marketingEmails" label="Marketing emails" />
            <PreferenceToggle name="systemNotifications" label="System notifications" />
          </div>
          <AppButton type="submit" loading={loading} disabled={loading} className="mt-4">
            Save notification preferences
          </AppButton>
        </form>
      </FormProvider>
    </AppCard>
  );
}
