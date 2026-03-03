"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormSelect } from "@/components/forms";
import { AppButton } from "@/components/design";
import { AppCard } from "@/components/design";
import type { UserPreferences } from "@/services/auth";

const schema = z.object({
  language: z.string().optional(),
  timezone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Kolkata", label: "India" },
  { value: "Asia/Tokyo", label: "Tokyo" },
];

export interface PreferencesFormProps {
  preferences: UserPreferences | null | undefined;
  onSubmit: (prefs: Pick<UserPreferences, "language" | "timezone">) => void | Promise<void>;
  loading?: boolean;
}

export function PreferencesForm({ preferences, onSubmit, loading = false }: PreferencesFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      language: preferences?.language ?? "en",
      timezone: preferences?.timezone ?? "UTC",
    },
  });

  useEffect(() => {
    form.reset({
      language: preferences?.language ?? "en",
      timezone: preferences?.timezone ?? "UTC",
    });
  }, [preferences?.language, preferences?.timezone]);

  return (
    <AppCard className="rounded-xl max-w-lg p-6">
      <h3 className="text-lg font-medium text-text-primary mb-2">Preferences</h3>
      <p className="text-sm text-text-secondary mb-6">
        Language and timezone for your account.
      </p>
      <FormProviderWrapper form={form as never} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormSelect name="language" label="Language" options={languageOptions} />
        <FormSelect name="timezone" label="Timezone" options={timezoneOptions} />
        <AppButton type="submit" loading={loading} disabled={loading}>
          Save preferences
        </AppButton>
      </FormProviderWrapper>
    </AppCard>
  );
}
