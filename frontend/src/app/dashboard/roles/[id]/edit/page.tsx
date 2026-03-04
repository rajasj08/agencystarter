"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { FormProviderWrapper, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LastEditedSummary } from "@/components/LastEditedSummary";
import { z } from "zod";
import { RoleFormContent } from "@/modules/roles/components/RoleFormContent";
import { useRole } from "@/modules/roles/hooks/useRoles";
import { updateRole, deleteRole } from "@/modules/roles/services/roleService";
import { toast } from "@/lib/toast";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  permissionIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export default function RoleEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { role, loading, error, fetchRole } = useRole(id);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: { name: "", permissionIds: [] },
  });

  useEffect(() => {
    if (id) fetchRole(id);
  }, [id, fetchRole]);

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        permissionIds: role.permissionIds ?? [],
      });
    }
  }, [role?.id]);

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      try {
        await updateRole(id, { name: data.name, permissionIds: data.permissionIds });
        toast.success("Role saved successfully.");
        router.push(ROUTES.ROLES);
      } catch (err) {
        setFormApiError<FormValues>(form.setError, err, "Update role failed");
      }
    },
    [id, router, form.setError]
  );

  const handleDeleteClick = useCallback(() => {
    if (!role?.isSystem) setDeleteConfirmOpen(true);
  }, [role?.isSystem]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteRole(id);
      setDeleteConfirmOpen(false);
      toast.success("Role deleted.");
      router.push(ROUTES.ROLES);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete role failed";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [id, router]);

  if (loading && !role) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (error && !role) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <p className="text-danger" role="alert">
          {error}
        </p>
        <AppButton variant="outline" className="mt-4" onClick={() => router.push(ROUTES.ROLES)}>
          Back to Roles
        </AppButton>
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="edit-role-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Edit Role</h1>
            <p className="text-sm text-gray-500">Update role name and permissions.</p>
          </div>
          <div className="flex gap-2">
            {!role.isSystem && (
              <AppButton
                type="button"
                variant="outline"
                onClick={handleDeleteClick}
                disabled={deleting}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </AppButton>
            )}
            <AppButton type="button" variant="outline" onClick={() => router.push(ROUTES.ROLES)}>
              Cancel
            </AppButton>
            <AppButton form="edit-role-form" type="submit" loading={form.formState.isSubmitting} disabled={!!role.isSystem}>
              Save Role
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <RoleFormContent mode="edit" isSystem={role.isSystem} initialData={role} />
          </div>
          <div className="lg:col-span-4">
            <LastEditedSummary
              updatedAt={role.updatedAt ?? new Date().toISOString()}
              updatedBy={role.updatedBy ?? null}
            />
          </div>
        </div>
      </FormProviderWrapper>

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => !open && !deleting && setDeleteConfirmOpen(false)}>
        <DialogContent showClose={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              Delete <strong>{role.name}</strong>? This cannot be undone. Users assigned to this role will need to
              be reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleting}
              disabled={deleting}
            >
              Delete
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
