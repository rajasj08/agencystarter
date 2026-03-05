"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { UserTable, ViewUserModal } from "@/modules/users";
import { useUsers } from "@/modules/users/hooks/useUsers";
import { useAuthorization } from "@/core/auth/useAuthorization";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import type { User } from "@/modules/users/types/userTypes";

export default function UsersPage() {
  const { hasPermission } = useAuthorization();
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data, meta, loading, error, fetchUsers } = useUsers({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });

  const load = useCallback(
    (page?: number, newSortBy?: string, newSortOrder?: "asc" | "desc") => {
      fetchUsers({
        page: page ?? meta.page,
        limit: meta.limit,
        sortBy: newSortBy ?? sortBy ?? "createdAt",
        sortOrder: newSortOrder ?? sortOrder,
      });
    },
    [fetchUsers, meta.page, meta.limit, sortBy, sortOrder]
  );

  useEffect(() => {
    load(1);
  }, []);

  const handleSort = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      load(meta.page, newSortBy, newSortOrder);
    },
    [load, meta.page]
  );

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_LIST}>
      <PageContainer
        title="Users"
        actions={
          hasPermission(PERMISSIONS.USER_CREATE) ? (
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
              sortBy,
              sortOrder,
              onSort: handleSort,
            }}
            canEdit={hasPermission(PERMISSIONS.USER_UPDATE)}
            onView={(user) => setViewUser(user)}
          />
          <ViewUserModal
            user={viewUser}
            open={!!viewUser}
            onOpenChange={(open) => !open && setViewUser(null)}
            canEdit={hasPermission(PERMISSIONS.USER_UPDATE)}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
