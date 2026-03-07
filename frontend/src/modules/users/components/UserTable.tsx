"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/design";
import { UserStatusBadge } from "./UserStatusBadge";
import { ROUTES } from "@/constants/routes";
import type { User } from "../types/userTypes";

export interface UserTableActionsProps {
  /** Show Edit link only when user has user:update */
  canEdit?: boolean;
  /** Show Delete button only when user has user:delete */
  canDelete?: boolean;
  /** Show Restore button for soft-deleted users (user:update or admin) */
  canRestore?: boolean;
  /** When set, View opens this callback (e.g. modal) instead of navigating to detail page */
  onView?: (user: User) => void;
  /** Called when user clicks delete (parent opens confirm modal and performs delete on confirm) */
  onDelete?: (user: User) => void;
  /** Called when user clicks restore (parent opens confirm modal and performs restore on confirm) */
  onRestore?: (user: User) => void;
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

export function UserTable({ data, loading, pagination, sort, canEdit, canDelete, canRestore, onView, onDelete, onRestore }: UserTableProps) {
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
      render: (row) => (
        <UserStatusBadge status={row.deletedAt != null ? "DELETED" : row.status} />
      ),
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
      render: (row) => {
        const isDeleted = row.deletedAt != null;
        if (isDeleted && canRestore && onRestore) {
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRestore(row)}
                title="Restore user"
                className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                aria-label="Restore user"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1">
            {onView ? (
              <button
                type="button"
                onClick={() => onView(row)}
                title="View user"
                className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                aria-label="View user"
              >
                <Eye className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <Link
                href={ROUTES.USER_VIEW(row.id)}
                title="View user"
                className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary inline-flex"
                aria-label="View user"
              >
                <Eye className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {canEdit && (
              <Link
                href={ROUTES.USER_EDIT(row.id)}
                title="Edit user"
                className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary inline-flex"
                aria-label="Edit user"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(row)}
                title="Delete user"
                className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-danger"
                aria-label="Delete user"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        );
      },
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
