"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { FormProviderWrapper, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { RoleFormContent } from "@/modules/roles/components/RoleFormContent";
import { createRole } from "@/modules/roles/services/roleService";
import { toast } from "@/lib/toast";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  permissionIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export default function RoleCreatePage() {
  const router = useRouter();
  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: { name: "", permissionIds: [] },
  });

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        await createRole({ name: data.name, permissionIds: data.permissionIds });
        toast.success("Role created.");
        router.push(ROUTES.ROLES);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Create role failed");
      }
    },
    [router, form.setError]
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="create-role-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Create Role</h1>
            <p className="text-sm text-gray-500">Add a custom role and assign permissions.</p>
          </div>
          <div className="flex gap-2">
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.ROLES)}>
              Cancel
            </AppButton>
            <AppButton form="create-role-form" type="submit" loading={form.formState.isSubmitting}>
              Save Role
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <RoleFormContent mode="create" />
      </FormProviderWrapper>
    </div>
  );
}
