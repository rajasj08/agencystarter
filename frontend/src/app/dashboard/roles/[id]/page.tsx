"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { useRole } from "@/modules/roles/hooks/useRoles";
import { getPermissions } from "@/modules/roles/services/roleService";
import { ROUTES } from "@/constants/routes";
import type { Permission } from "@/modules/roles/types/roleTypes";

export default function RoleViewPage() {
  const params = useParams();
  const id = params.id as string;
  const { role, loading, error, fetchRole } = useRole(id);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (id) fetchRole(id);
  }, [id, fetchRole]);

  useEffect(() => {
    getPermissions().then(setPermissions).catch(() => setPermissions([]));
  }, []);

  const idToName = (permId: string) => permissions.find((p) => p.id === permId)?.name ?? permId;

  if (loading && !role) {
    return (
      <PageContainer title="Role">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">Loading…</p>
        </AppCard>
      </PageContainer>
    );
  }

  if (error && !role) {
    return (
      <PageContainer title="Role">
        <AppCard className="rounded-xl p-6">
          <p className="text-danger" role="alert">
            {error}
          </p>
          <AppButton variant="outline" className="mt-4" asChild>
            <Link href={ROUTES.ROLES}>Back to Roles</Link>
          </AppButton>
        </AppCard>
      </PageContainer>
    );
  }

  if (!role) return null;

  return (
    <PageContainer
      title={role.name}
      actions={
        <>
          {!role.isSystem && (
            <AppButton variant="outline" asChild>
              <Link href={ROUTES.ROLE_EDIT(role.id)}>Edit</Link>
            </AppButton>
          )}
          <AppButton variant="outline" asChild>
            <Link href={ROUTES.ROLES}>Back to Roles</Link>
          </AppButton>
        </>
      }
    >
      <AppCard className="max-w-2xl rounded-xl p-6">
        <dl className="grid gap-4">
          <div>
            <dt className="text-sm font-medium text-text-secondary">Name</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm text-text-primary">
              {role.name}
              {role.isSystem && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">System</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-secondary">Permissions</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {role.permissionIds.map((permId) => (
                <span
                  key={permId}
                  className="inline-flex rounded-md border border-border bg-muted px-2 py-1 text-xs text-text-primary"
                >
                  {idToName(permId)}
                </span>
              ))}
              {role.permissionIds.length === 0 && (
                <span className="text-sm text-text-secondary">None</span>
              )}
            </dd>
          </div>
        </dl>
      </AppCard>
    </PageContainer>
  );
}
