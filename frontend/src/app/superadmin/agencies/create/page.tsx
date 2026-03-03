"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormPassword, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { setFormApiError } from "@/lib/formErrors";
import { getPlans, createAgency, type CreateAgencyInput, type Plan } from "@/services/superadmin";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  planId: z.string().min(1, "Plan is required"),
  adminEmail: z.string().email("Valid email is required"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminName: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SuperadminAgencyCreatePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      name: "",
      slug: "",
      planId: "",
      adminEmail: "",
      adminPassword: "",
      adminName: "",
    },
  });

  useEffect(() => {
    getPlans({ activeOnly: true })
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const input: CreateAgencyInput = {
          name: data.name,
          slug: data.slug,
          planId: data.planId,
          adminEmail: data.adminEmail,
          adminPassword: data.adminPassword,
          adminName: data.adminName || undefined,
        };
        await createAgency(input);
        toast.success("Agency and admin user created.");
        router.push(ROUTES.SUPERADMIN_AGENCIES);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Create agency failed");
      }
    },
    [router, form.setError]
  );

  return (
    <PageContainer
      title="Create Agency"
      breadcrumbs={[
        { label: "Superadmin", href: ROUTES.SUPERADMIN },
        { label: "Agencies", href: ROUTES.SUPERADMIN_AGENCIES },
        { label: "Create" },
      ]}
    >
      <AppCard className="max-w-2xl rounded-xl p-6">
        <p className="mb-6 text-sm text-text-secondary">
          Creates the agency and an agency admin user.
        </p>
        <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-agency-form">
          <FormRootError />
            <FormInput name="name" label="Agency name" required />
            <FormInput name="slug" label="Slug (lowercase, hyphens)" placeholder="my-agency" required />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Plan</label>
              <select
                {...form.register("planId")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                disabled={plansLoading}
              >
                <option value="">Select plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
              {form.formState.errors.planId && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.planId.message}</p>
              )}
            </div>
            <FormInput name="adminEmail" label="Admin email" type="email" required />
            <FormPassword name="adminPassword" label="Admin password" required />
            <FormInput name="adminName" label="Admin display name (optional)" />
            <div className="flex justify-end gap-2 pt-4">
              <AppButton
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.SUPERADMIN_AGENCIES)}
              >
                Cancel
              </AppButton>
              <AppButton
                form="create-agency-form"
                type="submit"
                loading={form.formState.isSubmitting}
                disabled={plansLoading || plans.length === 0}
              >
                Create
              </AppButton>
            </div>
        </FormProviderWrapper>
      </AppCard>
    </PageContainer>
  );
}
