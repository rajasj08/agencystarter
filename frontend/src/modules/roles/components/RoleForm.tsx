"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProviderWrapper } from "@/components/forms";
import { FormInput } from "@/components/forms";
import { AppButton } from "@/components/design";
import { PermissionSelector } from "./PermissionSelector";
import type { Role } from "../types/roleTypes";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  permissionIds: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof schema>;

export interface RoleFormProps {
  mode: "create" | "edit";
  initialData?: Role | null;
  onSubmit: (values: RoleFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function RoleForm({ mode, initialData, onSubmit, loading = false }: RoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      permissionIds: initialData?.permissionIds ?? [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        permissionIds: initialData.permissionIds ?? [],
      });
    }
  }, [initialData?.id]);

  return (
    <FormProviderWrapper
      form={form}
      onSubmit={onSubmit}
      className="space-y-6"
    >
      <FormInput name="name" label="Role name" />
      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">Permissions</p>
        <PermissionSelector name="permissionIds" />
      </div>
      <div className="flex gap-2">
        <AppButton type="submit" loading={loading} disabled={loading}>
          {mode === "create" ? "Create Role" : "Save Changes"}
        </AppButton>
      </div>
    </FormProviderWrapper>
  );
}
