"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { RoleForm } from "@/modules/roles";
import { createRole } from "@/modules/roles/services/roleService";
import { ROUTES } from "@/constants/routes";
import type { RoleFormValues } from "@/modules/roles/components/RoleForm";

export default function RoleCreatePage() {
  const router = useRouter();

  async function handleSubmit(values: RoleFormValues) {
    await createRole({
      name: values.name,
      permissionIds: values.permissionIds,
    });
    router.push(ROUTES.ROLES);
  }

  return (
    <PageContainer title="Create Role">
      <AppCard className="max-w-lg rounded-xl p-6">
        <RoleForm mode="create" onSubmit={handleSubmit} />
      </AppCard>
    </PageContainer>
  );
}
