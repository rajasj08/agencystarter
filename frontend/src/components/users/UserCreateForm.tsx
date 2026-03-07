"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormProviderWrapper,
  FormInput,
  FormPassword,
  FormRootError,
} from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { AppButton } from "@/components/design";
import { RoleSelect } from "@/modules/roles";
import { setFormApiError } from "@/lib/formErrors";
import { z } from "zod";
import { AgencyRoleField } from "@/components/users/AgencyRoleField";

export const userCreateFormSchema = (options: { withAgency: boolean }) =>
  z
    .object({
      ...(options.withAgency && { agencyId: z.string().min(1, "Agency is required") }),
      email: z.string().min(1, "Email is required").email("Invalid email"),
      name: z.string().max(255).optional(),
      roleValue: z.string().min(1, "Role is required"),
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

export type UserCreateFormValues = {
  agencyId?: string;
  email: string;
  name?: string;
  roleValue: string;
  invite?: boolean;
  password?: string;
};

export interface UserCreateFormProps {
  title?: string;
  description?: string;
  /** Show agency selector + role-by-agency (superadmin only). AgencyRoleField fetches roles internally. */
  showAgencyField?: boolean;
  agencyError?: string;
  /** Show "Send invitation" toggle (tenant). When false, password field is always shown. */
  inviteOption?: boolean;
  onSubmit: (data: UserCreateFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  submitErrorLabel?: string;
  hideHeaderTitle?: boolean;
}

// ---------------------------------------------------------------------------
// InviteToggle: controlled by useFormContext
// ---------------------------------------------------------------------------
function InviteToggle() {
  const { register } = useFormContext<UserCreateFormValues>();
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" id="invite" className="peer sr-only" {...register("invite")} />
      <div className="peer h-6 w-11 rounded-full border border-border bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-1 peer-focus:ring-primary/30" />
    </label>
  );
}

// ---------------------------------------------------------------------------
// UserCreateForm: main form shell
// ---------------------------------------------------------------------------
export function UserCreateForm({
  title = "Add User",
  description = "Create a new user or send an invitation to join your agency.",
  showAgencyField = false,
  agencyError,
  inviteOption = true,
  onSubmit,
  onCancel,
  submitLabel = "Create User",
  cancelLabel = "Cancel",
  loading = false,
  submitErrorLabel = "Create user failed",
  hideHeaderTitle = false,
}: UserCreateFormProps) {
  const schema = userCreateFormSchema({ withAgency: showAgencyField });
  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      ...(showAgencyField && { agencyId: "" }),
      email: "",
      name: "",
      roleValue: "",
      invite: inviteOption,
      password: "",
    } as UserCreateFormValues,
  });

  async function handleSubmit(data: UserCreateFormValues) {
    try {
      await onSubmit(data);
    } catch (err) {
      setFormApiError<UserCreateFormValues>(form.setError, err, submitErrorLabel);
    }
  }

  const invite = form.watch("invite");

  return (
    <div className="mx-auto max-w-[1200px]">
      <FormProviderWrapper
        form={form as import("react-hook-form").UseFormReturn<UserCreateFormValues>}
        onSubmit={handleSubmit}
        id="create-user-form"
      >
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {!hideHeaderTitle && (
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
              <p className="text-sm text-text-secondary">{description}</p>
            </div>
          )}
          <div className={hideHeaderTitle ? "flex gap-2 sm:ml-auto" : "flex gap-2"}>
            <AppButton type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </AppButton>
            <AppButton form="create-user-form" type="submit" loading={loading}>
              {submitLabel}
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">User information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {showAgencyField ? (
                <AgencyRoleField agencyError={agencyError} />
              ) : (
                <RoleSelect name="roleValue" label="Role" placeholder="Select role" />
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput name="email" label="Email" type="email" required />
                <FormInput name="name" label="Display name" />
              </div>

              {inviteOption && (
                <>
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                    <label htmlFor="invite" className="cursor-pointer text-sm text-text-primary">
                      Send invitation email (user sets their own password)
                    </label>
                    <InviteToggle />
                  </div>
                  {!invite && (
                    <div className="max-w-md">
                      <FormPassword
                        name="password"
                        label="Password"
                        helperText="Minimum 8 characters"
                      />
                    </div>
                  )}
                </>
              )}

              {!inviteOption && (
                <div className="max-w-md">
                  <FormPassword
                    name="password"
                    label="Password"
                    helperText="Minimum 8 characters"
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FormProviderWrapper>
    </div>
  );
}
