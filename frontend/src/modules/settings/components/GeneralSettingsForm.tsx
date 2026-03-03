"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput, FormSelect } from "@/components/forms";
import { AppButton } from "@/components/design";
import type { AgencySettings } from "../types/settingsTypes";

const schema = z.object({
  name: z.string().min(1, "Agency name is required").max(255).optional().or(z.literal("")),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers, hyphens only").optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email().optional().or(z.literal("")),
  supportPhone: z.string().max(30).optional().nullable(),
  contactFirstName: z.string().max(100).optional().nullable(),
  contactLastName: z.string().max(100).optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(30).optional().nullable(),
  timezone: z.string().optional().nullable(),
  defaultLanguage: z.string().max(10).optional().nullable(),
  dateFormat: z.string().max(30).optional().nullable(),
  currency: z.string().length(3).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Kolkata", label: "India" },
  { value: "Asia/Tokyo", label: "Tokyo" },
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const dateFormatOptions = [
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
];

const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "AUD", label: "AUD" },
  { value: "INR", label: "INR" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

export interface GeneralSettingsFormProps {
  initialData?: AgencySettings | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
  loading?: boolean;
}

export function GeneralSettingsForm({ initialData, onSubmit, loading = false }: GeneralSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      logo: initialData?.logo ?? "",
      websiteUrl: initialData?.websiteUrl ?? "",
      supportEmail: initialData?.supportEmail ?? "",
      supportPhone: initialData?.supportPhone ?? "",
      contactFirstName: initialData?.contactFirstName ?? "",
      contactLastName: initialData?.contactLastName ?? "",
      contactEmail: initialData?.contactEmail ?? "",
      contactPhone: initialData?.contactPhone ?? "",
      timezone: initialData?.timezone ?? "UTC",
      defaultLanguage: initialData?.defaultLanguage ?? "en",
      dateFormat: initialData?.dateFormat ?? "YYYY-MM-DD",
      currency: initialData?.currency ?? "USD",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name ?? "",
        slug: initialData.slug ?? "",
        logo: initialData.logo ?? "",
        websiteUrl: initialData.websiteUrl ?? "",
        supportEmail: initialData.supportEmail ?? "",
        supportPhone: initialData.supportPhone ?? "",
        contactFirstName: initialData.contactFirstName ?? "",
        contactLastName: initialData.contactLastName ?? "",
        contactEmail: initialData.contactEmail ?? "",
        contactPhone: initialData.contactPhone ?? "",
        timezone: initialData.timezone ?? "UTC",
        defaultLanguage: initialData.defaultLanguage ?? "en",
        dateFormat: initialData.dateFormat ?? "YYYY-MM-DD",
        currency: initialData.currency ?? "USD",
      });
    }
  }, [initialData]);

  return (
    <FormProviderWrapper form={form as never} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h2 className="text-lg font-medium text-text-primary mb-4">Agency Identity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <FormInput name="name" label="Agency name" />
          <FormInput name="slug" label="Agency slug" placeholder="my-agency" disabled  />
          <FormInput name="logo" label="Logo URL" type="url" placeholder="https://..." />
          <FormInput name="websiteUrl" label="Website URL" type="url" placeholder="https://..." />
          <FormInput name="supportEmail" label="Support email" type="email" />
          <FormInput name="supportPhone" label="Support phone" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-text-primary mb-4">Primary contact</h2>
        <p className="text-sm text-text-secondary mb-4">Main contact person for this agency.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <FormInput name="contactFirstName" label="Contact first name" />
          <FormInput name="contactLastName" label="Contact last name" />
          <FormInput name="contactEmail" label="Contact email" type="email" />
          <FormInput name="contactPhone" label="Contact phone" />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-text-primary mb-4">Localization</h2>
        <p className="text-sm text-text-secondary mb-4">Mandatory. Default timezone, language, date format and currency for the agency.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <FormSelect name="timezone" label="Timezone" options={timezoneOptions} />
          <FormSelect name="defaultLanguage" label="Default language" options={languageOptions} />
          <FormSelect name="dateFormat" label="Date format" options={dateFormatOptions} />
          <FormSelect name="currency" label="Currency" options={currencyOptions} helperText="e.g. USD, AUD, INR" />
        </div>
      </section>

      <AppButton type="submit" loading={loading} disabled={loading}>
        Save general settings
      </AppButton>
    </FormProviderWrapper>
  );
}
