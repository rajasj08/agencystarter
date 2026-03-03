"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormPassword, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { setFormApiError } from "@/lib/formErrors";
import { getAgencies, createUser, type CreateUserInput, type AgencyListItem } from "@/services/superadmin";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  agencyId: z.string().min(1, "Agency is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["AGENCY_ADMIN", "AGENCY_MEMBER", "USER"]),
  name: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: "AGENCY_ADMIN", label: "Agency Admin" },
  { value: "AGENCY_MEMBER", label: "Agency Member" },
  { value: "USER", label: "User" },
] as const;

export default function SuperadminUserCreatePage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<AgencyListItem[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      agencyId: "",
      email: "",
      password: "",
      role: "USER",
      name: "",
    },
  });

  useEffect(() => {
    getAgencies({ limit: 100 })
      .then(({ data }) => setAgencies(data.filter((a) => a.status === "ACTIVE")))
      .catch(() => setAgencies([]))
      .finally(() => setAgenciesLoading(false));
  }, []);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const input: CreateUserInput = {
          agencyId: data.agencyId,
          email: data.email,
          password: data.password,
          role: data.role,
          name: data.name || undefined,
        };
        await createUser(input);
        toast.success("User created.");
        router.push(ROUTES.SUPERADMIN_USERS);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Create user failed");
      }
    },
    [router, form.setError]
  );

  return (
    <PageContainer
      title="Add User"
      breadcrumbs={[
        { label: "Superadmin", href: ROUTES.SUPERADMIN },
        { label: "Platform Users", href: ROUTES.SUPERADMIN_USERS },
        { label: "Add user" },
      ]}
    >
      <AppCard className="max-w-2xl rounded-xl p-6">
        <p className="mb-6 text-sm text-text-secondary">
          Create a user in an agency. Only active agencies are listed.
        </p>
        <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-user-form">
          <FormRootError />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Agency</label>
              <select
                {...form.register("agencyId")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                disabled={agenciesLoading}
              >
                <option value="">Select agency</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.slug})
                  </option>
                ))}
              </select>
              {form.formState.errors.agencyId && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.agencyId.message}</p>
              )}
            </div>
            <FormInput name="email" label="Email" type="email" required />
            <FormPassword name="password" label="Password" required />
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Role</label>
              <select
                {...form.register("role")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <FormInput name="name" label="Display name (optional)" />
            <div className="flex justify-end gap-2 pt-4">
              <AppButton
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.SUPERADMIN_USERS)}
              >
                Cancel
              </AppButton>
              <AppButton
                form="create-user-form"
                type="submit"
                loading={form.formState.isSubmitting}
                disabled={agenciesLoading || agencies.length === 0}
              >
                Create user
              </AppButton>
            </div>
        </FormProviderWrapper>
      </AppCard>
    </PageContainer>
  );
}
