"use client";

import { useEffect, useCallback, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
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

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs({ page, limit: 20 });
      setData(result.data);
      setMeta(result.meta);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: "user",
      header: "User",
      render: (row) => row.userName || row.userEmail,
    },
    { key: "action", header: "Action", render: (row) => row.action },
    { key: "resource", header: "Module", render: (row) => row.resource },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <PageContainer title="Audit Logs">
      <AppCard className="rounded-xl p-6">
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
            onPageChange: load,
          }}
          className="rounded-xl"
        />
      </AppCard>
    </PageContainer>
  );
}
