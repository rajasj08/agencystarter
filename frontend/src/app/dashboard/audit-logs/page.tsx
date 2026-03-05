"use client";

import { useEffect, useCallback, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/design";
import { getAuditLogs } from "@/modules/auditLogs/services/auditLogService";
import type { AuditLogEntry } from "@/modules/auditLogs/services/auditLogService";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const load = useCallback(
    async (page = 1, newSortBy?: string, newSortOrder?: "asc" | "desc") => {
      const nextSortBy = newSortBy ?? sortBy ?? "createdAt";
      const nextSortOrder = newSortOrder ?? sortOrder;
      setLoading(true);
      setError(null);
      try {
        const result = await getAuditLogs({
          page,
          limit: 20,
          sortBy: nextSortBy,
          sortOrder: nextSortOrder,
        });
        setData(result.data);
        setMeta(result.meta);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load audit logs");
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortOrder]
  );

  const handleSort = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      load(meta.page, newSortBy, newSortOrder);
    },
    [load, meta.page]
  );

  useEffect(() => {
    load(1);
  }, []);

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: "user",
      header: "User",
      render: (row) => row.userName || row.userEmail,
    },
    { key: "action", header: "Action", sortKey: "action", render: (row) => row.action },
    { key: "resource", header: "Module", sortKey: "resource", render: (row) => row.resource },
    {
      key: "createdAt",
      header: "Date",
      sortKey: "createdAt",
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <PageContainer title="Audit Logs">
      {error && (
        <p className="mb-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <DataTable<AuditLogEntry>
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        emptyMessage="No audit log entries."
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
        className="rounded-xl"
      />
    </PageContainer>
  );
}
