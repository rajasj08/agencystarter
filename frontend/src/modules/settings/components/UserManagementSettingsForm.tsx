"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormSelect, FormCheckbox } from "@/components/forms";
import { AppButton } from "@/components/design";
import type { AgencySettings } from "../types/settingsTypes";

const schema = z.object({
  allowSelfRegistration: z.boolean(),
  defaultUserRole: z.string().max(50).optional().nullable(),
  requireAdminApproval: z.boolean(),
  allowUserInvitations: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const roleOptions = [
  { value: "user", label: "User" },
  { value: "agency_admin", label: "Agency Admin" },
  { value: "admin", label: "Admin" },
];

export interface UserManagementSettingsFormProps {
  initialData?: AgencySettings | null;
  onSubmit: (values: FormValues) => void | Promise<void>;
  loading?: boolean;
}

export function UserManagementSettingsForm({ initialData, onSubmit, loading = false }: UserManagementSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowSelfRegistration: initialData?.allowSelfRegistration ?? true,
      defaultUserRole: initialData?.defaultUserRole ?? "user",
      requireAdminApproval: initialData?.requireAdminApproval ?? false,
      allowUserInvitations: initialData?.allowUserInvitations ?? true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        allowSelfRegistration: initialData.allowSelfRegistration ?? true,
        defaultUserRole: initialData.defaultUserRole ?? "user",
        requireAdminApproval: initialData.requireAdminApproval ?? false,
        allowUserInvitations: initialData.allowUserInvitations ?? true,
      });
    }
  }, [initialData]);

  return (
    <FormProviderWrapper form={form as never} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-lg font-medium text-text-primary">User Management Settings</h2>
      <div className="space-y-4">
        <FormCheckbox
          name="allowSelfRegistration"
          label="Allow self registration"
          helperText="Let users sign up without an invitation."
        />
        <FormSelect
          name="defaultUserRole"
          label="Default user role"
          options={roleOptions}
          helperText="Role assigned to new users (e.g. self-registered or invited)."
        />
        <FormCheckbox
          name="requireAdminApproval"
          label="Require admin approval"
          helperText="New users must be approved by an admin before they can sign in."
        />
        <FormCheckbox
          name="allowUserInvitations"
          label="Allow user invitations"
          helperText="Admins can invite users by email."
        />
      </div>
      <AppButton type="submit" loading={loading} disabled={loading}>
        Save user management settings
      </AppButton>
    </FormProviderWrapper>
  );
}
