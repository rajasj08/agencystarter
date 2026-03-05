"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/design";
import { UserStatusBadge } from "./UserStatusBadge";
import { ROUTES } from "@/constants/routes";
import type { User } from "../types/userTypes";

export interface UserTableActionsProps {
  /** Show Edit link only when user has user:update */
  canEdit?: boolean;
  /** When set, View opens this callback (e.g. modal) instead of navigating to detail page */
  onView?: (user: User) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface UserTableProps extends UserTableActionsProps {
  data: User[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sort?: {
    sortBy: string | null;
    sortOrder: "asc" | "desc";
    onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  };
}

export function UserTable({ data, loading, pagination, sort, canEdit, onView }: UserTableProps) {
  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      sortKey: "name",
      render: (row) => row.name || "—",
    },
    {
      key: "email",
      header: "Email",
      sortKey: "email",
      render: (row) => row.email,
    },
    {
      key: "role",
      header: "Role",
      sortKey: "role",
      render: (row) => row.role,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (row) => <UserStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {onView ? (
            <button
              type="button"
              onClick={() => onView(row)}
              className="text-sm font-medium text-primary hover:underline"
            >
              View
            </button>
          ) : (
            <Link
              href={ROUTES.USER_VIEW(row.id)}
              className="text-sm font-medium text-primary hover:underline"
            >
              View
            </Link>
          )}
          {canEdit && (
            <Link
              href={ROUTES.USER_EDIT(row.id)}
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
    <DataTable<User>
      columns={columns}
      data={data}
      keyExtractor={(row) => row.id}
      emptyMessage="No users found."
      loading={loading}
      pagination={pagination}
      sort={sort}
      className="rounded-xl"
    />
  );
}
