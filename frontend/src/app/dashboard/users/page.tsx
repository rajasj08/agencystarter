"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { UserTable } from "@/modules/users";
import { useUsers } from "@/modules/users/hooks/useUsers";
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";

export default function UsersPage() {
  const { can } = usePermission();
  const { data, meta, loading, error, fetchUsers } = useUsers({ page: 1, limit: 10 });

  const load = useCallback(
    (page?: number, sortBy?: string, sortOrder?: "asc" | "desc") => {
      fetchUsers({
        page: page ?? meta.page,
        limit: meta.limit,
        sortBy,
        sortOrder,
      });
    },
    [fetchUsers, meta.page, meta.limit]
  );

  useEffect(() => {
    load(1);
  }, []);

  const handleSort = useCallback(
    (sortBy: string, sortOrder: "asc" | "desc") => {
      load(meta.page, sortBy, sortOrder);
    },
    [load, meta.page]
  );

  return (
    <PageContainer
      title="Users"
      actions={
        can(PERMISSIONS.USER_CREATE) ? (
          <AppButton asChild>
            <Link href={ROUTES.USER_CREATE}>Add User</Link>
          </AppButton>
        ) : undefined
      }
    >
      <div>
        {error && (
          <p className="mb-4 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <UserTable
          data={data}
          loading={loading}
          pagination={{
            page: meta.page,
            limit: meta.limit,
            total: meta.total,
            onPageChange: (page) => load(page),
          }}
          sort={{
            sortBy: "createdAt",
            sortOrder: "desc",
            onSort: handleSort,
          }}
        />
      </div>
    </PageContainer>
  );
}
