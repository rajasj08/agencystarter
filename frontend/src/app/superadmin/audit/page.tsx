"use client";

import { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSuperadminAuditLogs, type SuperadminAuditEntry } from "@/services/superadmin";
import { ChevronUp, ChevronDown } from "lucide-react";

type AuditSortField = "createdAt" | "action" | "resource";
type SortOrder = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  currentSortBy,
  currentOrder,
  onSort,
}: {
  label: string;
  sortKey: AuditSortField;
  currentSortBy: AuditSortField | null;
  currentOrder: SortOrder;
  onSort: (sortBy: AuditSortField, order: SortOrder) => void;
}) {
  const isActive = currentSortBy === sortKey;
  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-text-primary transition-colors font-medium"
        onClick={() => onSort(sortKey, isActive && currentOrder === "asc" ? "desc" : "asc")}
      >
        {label}
        {isActive && (currentOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </button>
    </TableHead>
  );
}

export default function SuperadminAuditPage() {
  const [entries, setEntries] = useState<SuperadminAuditEntry[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [sortBy, setSortBy] = useState<AuditSortField | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (page = 1, newSortBy?: AuditSortField, newOrder?: SortOrder) => {
      const sBy = newSortBy ?? sortBy ?? "createdAt";
      const sOrder = newOrder ?? sortOrder;
      if (newSortBy !== undefined) setSortBy(newSortBy);
      if (newOrder !== undefined) setSortOrder(newOrder);
      setLoading(true);
      getSuperadminAuditLogs({ page, limit: meta.limit, sortBy: sBy, sortOrder: sOrder })
        .then((res) => {
          setEntries(res.data);
          setMeta(res.meta);
        })
        .finally(() => setLoading(false));
    },
    [meta.limit, sortBy, sortOrder]
  );

  const handleSort = useCallback(
    (newSortBy: AuditSortField, newOrder: SortOrder) => {
      setSortBy(newSortBy);
      setSortOrder(newOrder);
      load(1, newSortBy, newOrder);
    },
    [load]
  );

  useEffect(() => {
    load(1);
  }, []);

  return (
    <PageContainer title="Audit Logs">
      <AppCard className="rounded-xl">
        {loading && entries.length === 0 ? (
          <p className="text-text-secondary">Loading…</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target agency</TableHead>
                  <TableHead>Target user</TableHead>
                  <TableHead>Impersonation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-text-secondary">
                      No audit entries
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-text-secondary whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{entry.action}</TableCell>
                      <TableCell>
                        <span className="text-text-secondary">{entry.actorEmail}</span>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {entry.targetAgencyId ?? "—"}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {entry.targetUserId ?? "—"}
                      </TableCell>
                      <TableCell>{entry.impersonation ? "Yes" : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {meta.pages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-sm text-text-secondary">
                  Page {meta.page} of {meta.pages} ({meta.total} total)
                </p>
                <div className="flex gap-2">
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() => load(meta.page - 1)}
                    disabled={meta.page <= 1}
                  >
                    Previous
                  </AppButton>
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() => load(meta.page + 1)}
                    disabled={meta.page >= meta.pages}
                  >
                    Next
                  </AppButton>
                </div>
              </div>
            )}
          </>
        )}
      </AppCard>
    </PageContainer>
  );
}
