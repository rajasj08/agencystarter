"use client";

import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProviderWrapper } from "@/components/forms";
import { AppButton } from "@/components/design";
import { RoleSelect } from "@/modules/roles";
import type { AgencySettings } from "../types/settingsTypes";
import type { Role } from "@/modules/roles/types/roleTypes";

const schema = z.object({
  defaultUserRoleId: z
    .string()
    .min(1)
    .max(100)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" || v == null ? null : v)),
});

type FormValues = z.infer<typeof schema>;

/** Resolve initial default role id: prefer defaultUserRoleId; else find role by legacy defaultUserRole (name). */
function getInitialDefaultRoleId(
  defaultUserRoleId: string | null | undefined,
  defaultUserRole: string | null | undefined,
  roles: Role[]
): string {
  if (defaultUserRoleId && roles.some((r) => r.id === defaultUserRoleId)) return defaultUserRoleId;
  const name = !defaultUserRole || typeof defaultUserRole !== "string" ? "USER" : defaultUserRole.trim();
  const byName = roles.find((r) => r.name === name || r.name.toLowerCase() === name.toLowerCase());
  return byName?.id ?? roles[0]?.id ?? "";
}

export interface UserManagementSettingsFormProps {
  initialData?: AgencySettings | null;
  /** Agency roles (system + custom) for Default user role dropdown. */
  roles?: Role[];
  onSubmit: (values: FormValues) => void | Promise<void>;
  loading?: boolean;
}

export function UserManagementSettingsForm({ initialData, roles = [], onSubmit, loading = false }: UserManagementSettingsFormProps) {
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name })),
    [roles]
  );

  const initialDefaultRoleId = getInitialDefaultRoleId(
    initialData?.defaultUserRoleId,
    initialData?.defaultUserRole,
    roles
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      defaultUserRoleId: initialDefaultRoleId || null,
    },
  });

  useEffect(() => {
    if (initialData || roles.length) {
      const defaultRoleId = getInitialDefaultRoleId(
        initialData?.defaultUserRoleId,
        initialData?.defaultUserRole,
        roles
      );
      form.reset({
        defaultUserRoleId: defaultRoleId || null,
      });
    }
  }, [initialData, roles]);

  return (
    <div className="max-w-[50%]">
      <FormProviderWrapper form={form as never} onSubmit={onSubmit} className="space-y-6">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">User Management Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
          <RoleSelect
            name="defaultUserRoleId"
            label="Default user role"
            options={roleOptions.length > 0 ? roleOptions : undefined}
            helperText="Role assigned to new users (e.g. SSO-provisioned or invited)."
          />
          </CardContent>
        </Card>
        <AppButton type="submit" loading={loading} disabled={loading}>
          Save user management settings
        </AppButton>
      </FormProviderWrapper>
    </div>
  );
}
