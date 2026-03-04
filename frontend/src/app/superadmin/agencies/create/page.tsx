"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-[1200px]">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-agency-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Create Agency</h1>
            <p className="text-sm text-gray-500">Add a new agency and its admin user.</p>
          </div>
          <div className="flex gap-2">
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.SUPERADMIN_AGENCIES)}>
              Cancel
            </AppButton>
            <AppButton
              form="create-agency-form"
              type="submit"
              loading={form.formState.isSubmitting}
              disabled={plansLoading || plans.length === 0}
            >
              Save Agency
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Agency Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormInput name="name" label="Agency name" required />
                  <div>
                    <FormInput name="slug" label="Slug" placeholder="my-agency" required />
                    <p className="mt-1 text-xs text-gray-500">Use lowercase letters, numbers, and hyphens only for the slug.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Admin User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-xs text-gray-500">The first user for this agency (agency admin).</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormInput name="adminEmail" label="Admin email" type="email" required />
                  <FormInput name="adminName" label="Admin display name (optional)" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormPassword name="adminPassword" label="Admin password" required />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FormProviderWrapper>
    </div>
  );
}
