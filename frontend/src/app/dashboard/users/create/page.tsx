"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper, FormInput, FormSelect, FormCheckbox, FormPassword, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { setFormApiError } from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { useUserMutations } from "@/modules/users/hooks/useUsers";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { ROUTES } from "@/constants/routes";
import { ROLES, PERMISSIONS } from "@/constants/permissions";
import type { UserCreateInput } from "@/modules/users/types/userTypes";

const schema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email"),
    name: z.string().max(255).optional(),
    role: z.string().min(1, "Role is required"),
    invite: z.boolean().optional(),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.invite) return true;
      return !!(data.password && data.password.length >= 8);
    },
    { message: "Password must be at least 8 characters when not inviting", path: ["password"] }
  );

type FormValues = z.infer<typeof schema>;

const roleOptions = [ROLES.AGENCY_ADMIN, ROLES.AGENCY_MEMBER, ROLES.USER].map((r) => ({
  value: r,
  label: r.replace(/_/g, " "),
}));

export default function UserCreatePage() {
  const router = useRouter();
  const { createUser, loading } = useUserMutations();

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      email: "",
      name: "",
      role: ROLES.AGENCY_MEMBER,
      invite: false,
      password: "",
    },
  });

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        const input: UserCreateInput = {
          email: data.email,
          name: data.name || undefined,
          role: data.role,
          invite: data.invite,
          password: data.invite ? undefined : data.password,
        };
        const user = await createUser(input);
        if (user) {
          toast.success(input.invite ? "Invitation sent." : "User created.");
          router.push(ROUTES.USERS);
        }
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Create user failed");
      }
    },
    [router, form.setError]
  );

  const invite = form.watch("invite");

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_CREATE}>
      <div className="mx-auto max-w-[1200px]">
        <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-user-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Add User</h1>
            <p className="text-sm text-gray-500">Create a new user or send an invitation to join your agency.</p>
          </div>
          <div className="flex gap-2">
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.USERS)}>
              Cancel
            </AppButton>
            <AppButton form="create-user-form" type="submit" loading={loading}>
              Create User
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormInput name="email" label="Email" type="email" required />
                  <FormInput name="name" label="Display name" />
                </div>
                <FormSelect name="role" label="Role" options={roleOptions} />
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                  <InviteCheckboxLabel />
                  <InviteToggle />
                </div>
                {!invite && (
                  <div className="max-w-md">
                    <FormPassword name="password" label="Password" helperText="Minimum 8 characters" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </FormProviderWrapper>
    </div>
    </ProtectedRoute>
  );
}

function InviteCheckboxLabel() {
  return (
    <label htmlFor="invite" className="cursor-pointer text-sm text-text-primary">
      Send invitation email (user sets their own password)
    </label>
  );
}

function InviteToggle() {
  const { register } = useFormContext<FormValues>();
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" id="invite" className="peer sr-only" {...register("invite")} />
      <div className="peer h-6 w-11 rounded-full border border-border bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-1 peer-focus:ring-primary/30" />
    </label>
  );
}
