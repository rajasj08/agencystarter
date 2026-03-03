"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { RoleForm } from "@/modules/roles";
import { useRole } from "@/modules/roles/hooks/useRoles";
import { updateRole } from "@/modules/roles/services/roleService";
import { ROUTES } from "@/constants/routes";
import type { RoleFormValues } from "@/modules/roles/components/RoleForm";
import type { Role } from "@/modules/roles/types/roleTypes";

export default function RoleEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { role, loading, error, fetchRole } = useRole(id);

  useEffect(() => {
    if (id) fetchRole(id);
  }, [id, fetchRole]);

  async function handleSubmit(values: RoleFormValues) {
    await updateRole(id, {
      name: values.name,
      permissionIds: values.permissionIds,
    });
    router.push(ROUTES.ROLE_VIEW(id));
  }

  if (loading && !role) {
    return (
      <PageContainer title="Edit Role">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">Loading…</p>
        </AppCard>
      </PageContainer>
    );
  }

  if (error && !role) {
    return (
      <PageContainer title="Edit Role">
        <AppCard className="rounded-xl p-6">
          <p className="text-danger" role="alert">
            {error}
          </p>
        </AppCard>
      </PageContainer>
    );
  }

  if (!role) return null;

  const initialData: Role = {
    id: role.id,
    name: role.name,
    agencyId: role.agencyId,
    isSystem: role.isSystem,
    permissionIds: role.permissionIds,
  };

  return (
    <PageContainer title={`Edit ${role.name}`}>
      <AppCard className="max-w-lg rounded-xl p-6">
        <RoleForm mode="edit" initialData={initialData} onSubmit={handleSubmit} />
      </AppCard>
    </PageContainer>
  );
}
