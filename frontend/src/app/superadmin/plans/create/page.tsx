"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppCard, AppButton } from "@/components/design";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper, FormInput, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { useFormContext } from "react-hook-form";
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
    <div className="mx-auto max-w-[1200px]">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-plan-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Create Plan</h1>
            <p className="text-sm text-gray-500">Configure pricing, limits and features.</p>
          </div>
          <div className="flex gap-2">
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.SUPERADMIN_PLANS)}>
              Cancel
            </AppButton>
            <AppButton form="create-plan-form" type="submit" loading={form.formState.isSubmitting}>
              Save Plan
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Plan Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormInput name="name" label="Plan Name" required />
                  <div>
                    <FormInput name="code" label="Plan Code" required />
                    <p className="mt-1 text-xs text-gray-500">Plan code cannot be changed after creation.</p>
                  </div>
                </div>
                <FormInput name="description" label="Description" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <FormInput name="price" label="Price" type="number" min={0} helperText="Set price to 0 for free plan." />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Usage Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="mb-4 text-xs text-gray-500">Use -1 for unlimited.</p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormInput name="maxUsers" label="Max Users" type="number" min={-1} />
                  <FormInput name="maxEmployees" label="Max Employees" type="number" min={-1} />
                  <FormInput name="maxLocations" label="Max Locations" type="number" min={-1} />
                  <FormInput name="maxFacilities" label="Max Facilities" type="number" min={-1} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Enabled Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {PLAN_FEATURE_KEYS.map((key) => (
                    <FeatureToggle key={key} name={`features.${key}`} label={featureLabels[key] ?? key} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="max-w-md">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium">Plan Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
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
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                    <label htmlFor="isDefault" className="cursor-pointer text-sm text-text-primary">
                      Set as Default Plan
                    </label>
                    <ToggleSwitch id="isDefault" {...form.register("isDefault")} />
                  </div>
                  {form.watch("isDefault") && (
                    <p className="text-xs text-amber-600">Only one plan can be default.</p>
                  )}
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                    <label htmlFor="isCustom" className="cursor-pointer text-sm text-text-primary">
                      Enterprise-only custom plan
                    </label>
                    <ToggleSwitch id="isCustom" {...form.register("isCustom")} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </FormProviderWrapper>
    </div>
  );
}

function ToggleSwitch({
  id,
  ...rest
}: { id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" id={id} className="peer sr-only" {...rest} />
      <div className="peer h-6 w-11 rounded-full border border-border bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/30" />
    </label>
  );
}

function FeatureToggle({ name, label }: { name: string; label: string }) {
  const { register } = useFormContext<FormValues>();
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
      <span className="text-sm text-text-primary">{label}</span>
      <ToggleSwitch id={name} {...register(name)} />
    </div>
  );
}
