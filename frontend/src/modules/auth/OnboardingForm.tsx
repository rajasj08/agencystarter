"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { onboardingSchema, type OnboardingFormValues } from "@/validations/auth";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import type { ApiSuccess } from "@/services/api";
import type { AuthUser } from "@/services/auth";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/permissions";

export function OnboardingForm() {
  const router = useRouter();
  const { user, accessToken, setUser } = useAuthStore();
  const form = useAppForm<typeof onboardingSchema>({
    schema: onboardingSchema,
    defaultValues: { name: "", slug: "" },
  });

  useEffect(() => {
    if (!accessToken) router.replace(ROUTES.LOGIN);
    if (user?.role === ROLES.SUPER_ADMIN) router.replace(ROUTES.SUPERADMIN);
    if (user?.agencyId && user?.agency?.onboardingCompleted) router.replace(ROUTES.DASHBOARD);
  }, [user, accessToken, router]);

  function deriveSlug(value: string) {
    form.setValue(
      "slug",
      value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    );
  }

  async function onSubmit(data: OnboardingFormValues) {
    try {
      await api.post("/agencies", { name: data.name, slug: data.slug });
      const { data: meData } = await api.get<ApiSuccess<AuthUser>>("/auth/me");
      setUser(meData.data);
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    } catch (err) {
      setFormApiError<OnboardingFormValues>(form.setError, err, "Failed to create agency");
    }
  }

  if (!user || user.role === ROLES.SUPER_ADMIN || (user.agencyId && user.agency?.onboardingCompleted)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <AppCard
      title="Create your agency"
      description="Set up your workspace."
      footer={
        <AppButton
          form="onboarding-form"
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
        >
          Create agency
        </AppButton>
      }
    >
      <FormProviderWrapper form={form} id="onboarding-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FormRootError />
        <FormInput
          name="name"
          label="agency.name"
          placeholder="Acme Inc"
          onAfterChange={deriveSlug}
        />
        <FormInput name="slug" label="agency.slug" placeholder="acme-inc" />
      </FormProviderWrapper>
    </AppCard>
  );
}
