"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { RoleTable } from "@/modules/roles";
import { useRoles } from "@/modules/roles/hooks/useRoles";
import { useAuthorization } from "@/core/auth/useAuthorization";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";

export default function RolesPage() {
  const { hasPermission } = useAuthorization();
  const { data, loading, error, fetchRoles } = useRoles();
  const [sortBy, setSortBy] = useState<string | null>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const sortedData = useMemo(() => {
    if (!sortBy || !sortOrder) return data;
    return [...data].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortBy === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === "permissionCount") {
        aVal = a.permissionIds.length;
        bVal = b.permissionIds.length;
      } else {
        return 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortOrder]);

  const handleSort = useCallback((newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.ROLE_READ}>
      <PageContainer
        title="Roles"
        actions={
          hasPermission(PERMISSIONS.ROLE_CREATE) ? (
            <AppButton asChild>
              <Link href={ROUTES.ROLE_CREATE}>Create Role</Link>
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
        <RoleTable
          data={sortedData}
          loading={loading}
          sort={{
            sortBy,
            sortOrder,
            onSort: handleSort,
          }}
        />
      </div>
    </PageContainer>
    </ProtectedRoute>
  );
}
