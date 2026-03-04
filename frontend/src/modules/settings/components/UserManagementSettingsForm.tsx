"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper } from "@/components/forms";
import { FormSelect } from "@/components/forms";
import { AppButton, ToggleSwitch } from "@/components/design";
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
    <div className="max-w-[50%]">
      <FormProviderWrapper form={form as never} onSubmit={onSubmit} className="space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">User Management Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
            <div>
              <span className="text-sm font-medium text-text-primary">Allow self registration</span>
              <p className="text-xs text-text-secondary">Let users sign up without an invitation.</p>
            </div>
            <ToggleSwitch id="allowSelfRegistration" {...form.register("allowSelfRegistration")} />
          </div>
          <FormSelect
            name="defaultUserRole"
            label="Default user role"
            options={roleOptions}
            helperText="Role assigned to new users (e.g. self-registered or invited)."
          />
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
            <div>
              <span className="text-sm font-medium text-text-primary">Require admin approval</span>
              <p className="text-xs text-text-secondary">New users must be approved by an admin before they can sign in.</p>
            </div>
            <ToggleSwitch id="requireAdminApproval" {...form.register("requireAdminApproval")} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
            <div>
              <span className="text-sm font-medium text-text-primary">Allow user invitations</span>
              <p className="text-xs text-text-secondary">Admins can invite users by email.</p>
            </div>
            <ToggleSwitch id="allowUserInvitations" {...form.register("allowUserInvitations")} />
          </div>
          </CardContent>
        </Card>
        <AppButton type="submit" loading={loading} disabled={loading}>
          Save user management settings
        </AppButton>
      </FormProviderWrapper>
    </div>
  );
}
