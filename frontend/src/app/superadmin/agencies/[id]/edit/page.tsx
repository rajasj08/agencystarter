"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper, FormInput, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { setFormApiError } from "@/lib/formErrors";
import {
  getAgencyById,
  getPlans,
  updateAgency,
  type AgencyListItem,
  type AgencyStatus,
  type Plan,
} from "@/services/superadmin";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { LastEditedSummary, type EditorInfo } from "@/components/LastEditedSummary";

const statusOptions: { value: AgencyStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DELETED", label: "Deleted" },
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED", "DELETED"]),
  planId: z.union([z.string().max(100), z.literal("")]).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SuperadminAgencyEditPage() {
  const params = useParams();
  const router = useRouter();
  const agencyId = params.id as string;
  const [agency, setAgency] = useState<AgencyListItem | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [agencyUpdatedAt, setAgencyUpdatedAt] = useState<string>("");
  const [agencyUpdatedBy, setAgencyUpdatedBy] = useState<EditorInfo | null>(null);

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      name: "",
      status: "ACTIVE",
      planId: "",
    },
  });

  useEffect(() => {
    if (!agencyId) return;
    setLoading(true);
    setNotFound(false);
    const load = async () => {
      try {
        const [agencyData, plansList] = await Promise.all([
          getAgencyById(agencyId),
          getPlans({ activeOnly: true }),
        ]);
        setAgency(agencyData);
        setPlans(plansList);
        setAgencyUpdatedAt(agencyData.updatedAt);
        setAgencyUpdatedBy(agencyData.updatedBy ?? null);
        form.reset({
          name: agencyData.name,
          status: agencyData.status as AgencyStatus,
          planId: "",
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencyId]);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        await updateAgency(agencyId, {
          name: data.name,
          status: data.status as AgencyStatus,
          planId: data.planId?.trim() || null,
        });
        toast.success("Agency updated.");
        router.push(ROUTES.SUPERADMIN_AGENCIES);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Update agency failed");
      }
    },
    [agencyId, router, form.setError]
  );

  if (loading && !agency) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (notFound || !agency) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <p className="text-text-secondary">Agency not found.</p>
        <AppButton
          variant="outline"
          className="mt-4"
          onClick={() => router.push(ROUTES.SUPERADMIN_AGENCIES)}
        >
          Back to Agencies
        </AppButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="edit-agency-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Edit Agency</h1>
            <p className="text-sm text-gray-500">
              Slug: <span className="font-mono">{agency.slug}</span> (read-only)
            </p>
          </div>
          <div className="flex gap-2">
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.SUPERADMIN_AGENCIES)}>
              Cancel
            </AppButton>
            <AppButton form="edit-agency-form" type="submit" loading={form.formState.isSubmitting}>
              Save Agency
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-2xl border border-border p-6 shadow-sm">
              <CardHeader className="border-0 p-0 pb-4">
                <CardTitle className="text-base font-medium">Agency Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="space-y-4">
                  <FormInput name="name" label="Agency name" required />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">Slug</label>
                    <div className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-sm text-text-secondary">
                      {agency.slug}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Slug cannot be changed after creation.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">Plan (optional)</label>
                    <select
                      {...form.register("planId")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                      disabled={plans.length === 0}
                    >
                      <option value="">Leave empty to keep current</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
                    <select
                      {...form.register("status")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.status && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.status.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <LastEditedSummary updatedAt={agencyUpdatedAt} updatedBy={agencyUpdatedBy} />
          </div>
        </div>
      </FormProviderWrapper>
    </div>
  );
}
