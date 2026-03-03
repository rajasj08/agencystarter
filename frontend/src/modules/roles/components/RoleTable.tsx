"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/design";
import { ROUTES } from "@/constants/routes";
import type { Role } from "../types/roleTypes";

export interface RoleTableProps {
  data: Role[];
  loading?: boolean;
}

export function RoleTable({ data, loading }: RoleTableProps) {
  const columns: DataTableColumn<Role>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <span className="flex items-center gap-2">
          {row.name}
          {row.isSystem && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">System</span>
          )}
        </span>
      ),
    },
    {
      key: "permissionIds",
      header: "Permissions",
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {row.permissionIds.length} permission{row.permissionIds.length !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.ROLE_VIEW(row.id)}
            className="text-sm font-medium text-primary hover:underline"
          >
            View
          </Link>
          {!row.isSystem && (
            <Link
              href={ROUTES.ROLE_EDIT(row.id)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Edit
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable<Role>
      columns={columns}
      data={data}
      keyExtractor={(row) => row.id}
      emptyMessage="No roles found."
      loading={loading}
      className="rounded-xl"
    />
  );
}
