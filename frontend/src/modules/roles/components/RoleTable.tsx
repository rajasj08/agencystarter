"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/design";
import { ROUTES } from "@/constants/routes";
import { ViewRoleModal } from "./ViewRoleModal";
import type { Role } from "../types/roleTypes";

export interface RoleTableProps {
  data: Role[];
  loading?: boolean;
  sort?: {
    sortBy: string | null;
    sortOrder: "asc" | "desc";
    onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  };
}

export function RoleTable({ data, loading, sort }: RoleTableProps) {
  const [viewRoleId, setViewRoleId] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const openViewModal = (id: string) => {
    setViewRoleId(id);
    setViewModalOpen(true);
  };

  const columns: DataTableColumn<Role>[] = [
    {
      key: "name",
      header: "Name",
      sortKey: "name",
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
      sortKey: "permissionCount",
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openViewModal(row.id)}
            title="View role"
            className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
            aria-label="View role"
          >
            <Eye className="h-4 w-4" aria-hidden />
          </button>
          {!row.isSystem && (
            <Link
              href={ROUTES.ROLE_EDIT(row.id)}
              title="Edit role"
              className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary inline-flex"
              aria-label="Edit role"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable<Role>
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        emptyMessage="No roles found."
        loading={loading}
        sort={sort}
        className="rounded-xl"
      />
      <ViewRoleModal
        roleId={viewRoleId}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />
    </>
  );
}
