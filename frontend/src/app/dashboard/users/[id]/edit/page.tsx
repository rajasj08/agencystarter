"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper, FormInput, FormSelect, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { LastEditedSummary } from "@/components/LastEditedSummary";
import { setFormApiError } from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { useUser, useUserMutations } from "@/modules/users/hooks/useUsers";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { ROUTES } from "@/constants/routes";
import { ROLES, PERMISSIONS } from "@/constants/permissions";
import type { UserUpdateInput } from "@/modules/users/types/userTypes";

const schema = z.object({
  name: z.string().max(255).optional(),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]),
});

type FormValues = z.infer<typeof schema>;

const roleOptions = [ROLES.AGENCY_ADMIN, ROLES.AGENCY_MEMBER, ROLES.USER].map((r) => ({
  value: r,
  label: r.replace(/_/g, " "),
}));

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: loadingUser, error: fetchError, fetchUser } = useUser(id);
  const { updateUser, loading: saving } = useUserMutations();
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      name: "",
      role: ROLES.AGENCY_MEMBER,
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!id) return;
    fetchUser(id);
  }, [id, fetchUser]);

  useEffect(() => {
    if (!user) return;
    const values: FormValues = {
      name: user.name ?? "",
      role: user.role,
      status: user.status === "INVITED" ? "ACTIVE" : user.status,
    };
    setInitialValues(values);
    form.reset(values);
  }, [user?.id]);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const input: UserUpdateInput = {
          name: data.name || undefined,
          role: data.role,
          status: data.status,
        };
        const updated = await updateUser(id, input);
        if (updated) {
          toast.success("User updated.");
          router.push(ROUTES.USERS);
        }
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Update user failed");
      }
    },
    [id, router, form.setError]
  );

  const loading = (loadingUser && !user) || (user && !initialValues);
  const showError = fetchError && !user;

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_UPDATE}>
      {loading && (
        <div className="mx-auto max-w-[1200px]">
          <Card className="rounded-2xl shadow-sm">
            <p className="text-text-secondary">Loading…</p>
          </Card>
        </div>
      )}
      {showError && (
        <div className="mx-auto max-w-[1200px]">
          <Card className="rounded-2xl shadow-sm">
            <p className="text-text-secondary">{fetchError}</p>
            <AppButton variant="outline" className="mt-4" onClick={() => router.push(ROUTES.USERS)}>
              Back to Users
            </AppButton>
          </Card>
        </div>
      )}
      {!loading && !showError && user && (
    <div className="mx-auto max-w-[1200px]">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="edit-user-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Edit User</h1>
            <p className="text-sm text-gray-500">Update role, status and display name.</p>
          </div>
          <div className="flex gap-2">
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.USERS)}>
              Cancel
            </AppButton>
            <AppButton form="edit-user-form" type="submit" loading={saving}>
              Save Changes
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Email</label>
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-text-secondary">
                    {user.email}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed here.</p>
                </div>
                <FormInput name="name" label="Display name" />
                <FormSelect name="role" label="Role" options={roleOptions} />
                <FormSelect name="status" label="Status" options={statusOptions} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <LastEditedSummary updatedAt={user.updatedAt} updatedBy={user.updatedBy ?? undefined} />
          </div>
        </div>
      </FormProviderWrapper>
    </div>
      )}
    </ProtectedRoute>
  );
}
