"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { RoleTable } from "@/modules/roles";
import { useRoles } from "@/modules/roles/hooks/useRoles";
import { ROUTES } from "@/constants/routes";

export default function RolesPage() {
  const { data, loading, error, fetchRoles } = useRoles();

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <PageContainer
      title="Roles"
      actions={
        <AppButton asChild>
          <Link href={ROUTES.ROLE_CREATE}>Create Role</Link>
        </AppButton>
      }
    >
      <div>
        {error && (
          <p className="mb-4 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <RoleTable data={data} loading={loading} />
      </div>
    </PageContainer>
  );
}
