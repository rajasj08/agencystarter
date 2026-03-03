"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { setFormApiError } from "@/lib/formErrors";
import { getPlanById, updatePlan, type PlanUpdateInput, PLAN_FEATURE_KEYS } from "@/services/superadmin";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
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

const featureLabels: Record<string, string> = {
  reports: "Reports",
  auditLogs: "Audit logs",
};

export default function SuperadminPlanEditPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [planCode, setPlanCode] = useState<string>("");

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      maxUsers: 0,
      maxLocations: 0,
      maxFacilities: 0,
      maxEmployees: 0,
      features: {},
      status: "ACTIVE",
      isDefault: false,
      isCustom: false,
    },
  });

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    setNotFound(false);
    getPlanById(planId)
      .then((plan) => {
        const features: Record<string, boolean> = { ...plan.features };
        PLAN_FEATURE_KEYS.forEach((k) => {
          if (!(k in features)) features[k] = false;
        });
        const values: FormValues = {
          name: plan.name,
          description: plan.description ?? "",
          price: plan.price,
          maxUsers: plan.maxUsers,
          maxLocations: plan.maxLocations,
          maxFacilities: plan.maxFacilities,
          maxEmployees: plan.maxEmployees,
          features,
          status: plan.isActive ? "ACTIVE" : "INACTIVE",
          isDefault: plan.isDefault,
          isCustom: plan.isCustom ?? false,
        };
        setPlanCode(plan.code);
        setInitialValues(values);
        form.reset(values);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [planId]);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const input: PlanUpdateInput = {
          name: data.name,
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
        await updatePlan(planId, input);
        toast.success("Plan updated.");
        router.push(ROUTES.SUPERADMIN_PLANS);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Update plan failed");
      }
    },
    [planId, router, form.setError]
  );

  if (loading && !initialValues) {
    return (
      <PageContainer title="Edit Plan">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">Loading…</p>
        </AppCard>
      </PageContainer>
    );
  }

  if (notFound || !initialValues) {
    return (
      <PageContainer title="Edit Plan">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">Plan not found.</p>
          <AppButton
            variant="outline"
            className="mt-4"
            onClick={() => router.push(ROUTES.SUPERADMIN_PLANS)}
          >
            Back to Plans
          </AppButton>
        </AppCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit Plan: ${initialValues.name}`}
      breadcrumbs={[
        { label: "Superadmin", href: ROUTES.SUPERADMIN },
        { label: "Plans", href: ROUTES.SUPERADMIN_PLANS },
        { label: "Edit" },
      ]}
    >
      <AppCard className="max-w-2xl rounded-xl p-6">
        <p className="mb-6 text-sm text-text-secondary">
          Code cannot be changed after creation.
        </p>
        <FormProviderWrapper form={form} onSubmit={handleSubmit} id="edit-plan-form">
          <FormRootError />
            <FormInput name="name" label="Name" required />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Code</label>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-sm text-text-secondary">
                {planCode || "—"}
              </div>
              <p className="mt-1 text-xs text-text-secondary">Cannot be changed after creation.</p>
            </div>
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
              <AppButton form="edit-plan-form" type="submit" loading={form.formState.isSubmitting}>
                Save
              </AppButton>
            </div>
        </FormProviderWrapper>
      </AppCard>
    </PageContainer>
  );
}
