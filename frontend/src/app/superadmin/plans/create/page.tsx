"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { setFormApiError } from "@/lib/formErrors";
import { createPlan, type PlanCreateInput, PLAN_FEATURE_KEYS } from "@/services/superadmin";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Z0-9_]+$/, "Use uppercase letters, numbers, and underscores only"),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().int().min(0),
  maxUsers: z.coerce.number().int().min(-1),
  maxLocations: z.coerce.number().int().min(-1),
  maxFacilities: z.coerce.number().int().min(-1),
  maxEmployees: z.coerce.number().int().min(-1),
  features: z.record(z.string(), z.boolean()).default({}),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  isDefault: z.boolean(),
  isCustom: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const defaultFeatures: Record<string, boolean> = Object.fromEntries(
  PLAN_FEATURE_KEYS.map((k) => [k, false])
);

const featureLabels: Record<string, string> = {
  reports: "Reports",
  auditLogs: "Audit logs",
};

export default function SuperadminPlanCreatePage() {
  const router = useRouter();
  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      maxUsers: 0,
      maxLocations: 0,
      maxFacilities: 0,
      maxEmployees: 0,
      features: defaultFeatures,
      status: "ACTIVE",
      isDefault: false,
      isCustom: false,
    },
  });

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const input: PlanCreateInput = {
          name: data.name,
          code: data.code,
          description: data.description || null,
          price: data.price,
          maxUsers: data.maxUsers,
          maxLocations: data.maxLocations,
          maxFacilities: data.maxFacilities,
          maxEmployees: data.maxEmployees,
          features: data.features,
          isActive: data.status === "ACTIVE",
          isDefault: data.isDefault,
          isCustom: data.isCustom ? true : null,
        };
        await createPlan(input);
        toast.success("Plan created.");
        router.push(ROUTES.SUPERADMIN_PLANS);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Create plan failed");
      }
    },
    [router, form.setError]
  );

  return (
    <PageContainer
      title="Create Plan"
      breadcrumbs={[
        { label: "Superadmin", href: ROUTES.SUPERADMIN },
        { label: "Plans", href: ROUTES.SUPERADMIN_PLANS },
        { label: "Create" },
      ]}
    >
      <AppCard className="max-w-2xl rounded-xl p-6">
        <p className="mb-6 text-sm text-text-secondary">
          Define limits and pricing for a new plan.
        </p>
        <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-plan-form">
          <FormRootError />
            <FormInput name="name" label="Name" required />
            <FormInput name="code" label="Code (e.g. FREE, STARTER)" required />
            <FormInput name="description" label="Description" />
            <FormInput name="price" label="Price" type="number" min={0} />
            <FormInput name="maxUsers" label="Max users" type="number" min={-1} placeholder="-1 = unlimited" />
            <FormInput name="maxLocations" label="Max locations" type="number" min={-1} placeholder="-1 = unlimited" />
            <FormInput name="maxFacilities" label="Max facilities" type="number" min={-1} placeholder="-1 = unlimited" />
            <FormInput name="maxEmployees" label="Max employees" type="number" min={-1} placeholder="-1 = unlimited" />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
              <select
                {...form.register("status")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary">Features</span>
              <div className="flex flex-wrap gap-4">
                {PLAN_FEATURE_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      id={`features.${key}`}
                      type="checkbox"
                      {...form.register(`features.${key}`)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor={`features.${key}`} className="text-sm text-text-primary">
                      {featureLabels[key] ?? key}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="isDefault"
                  type="checkbox"
                  {...form.register("isDefault")}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm text-text-primary">
                  Make it default
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isCustom"
                  type="checkbox"
                  {...form.register("isCustom")}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isCustom" className="text-sm text-text-primary">
                  Enterprise-only custom plan?
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <AppButton
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.SUPERADMIN_PLANS)}
              >
                Cancel
              </AppButton>
              <AppButton form="create-plan-form" type="submit" loading={form.formState.isSubmitting}>
                Create
              </AppButton>
            </div>
        </FormProviderWrapper>
      </AppCard>
    </PageContainer>
  );
}
