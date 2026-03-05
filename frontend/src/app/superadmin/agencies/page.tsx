"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import {
  getAgencies,
  loginAsAgency,
  type AgencyListItem,
} from "@/services/superadmin";
import { useAuthStore } from "@/store/auth";
import { getMe } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";
import { Pencil, LogIn, ChevronUp, ChevronDown } from "lucide-react";

type SortField = "name" | "slug" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  currentSortBy,
  currentOrder,
  onSort,
}: {
  label: string;
  sortKey: SortField;
  currentSortBy: SortField | null;
  currentOrder: SortOrder;
  onSort: (sortBy: SortField, order: SortOrder) => void;
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

export default function SuperadminAgenciesPage() {
  const [list, setList] = useState<AgencyListItem[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const setAuth = useAuthStore((s) => s.setAuth);
  const getStoredRefreshToken = useAuthStore((s) => s.getStoredRefreshToken);

  const loadAgencies = useCallback(
    (p = page, newSortBy?: SortField, newOrder?: SortOrder) => {
      const sBy = newSortBy ?? sortBy ?? "createdAt";
      const sOrder = newOrder ?? sortOrder;
      if (newSortBy !== undefined) setSortBy(newSortBy);
      if (newOrder !== undefined) setSortOrder(newOrder);
      setLoading(true);
      getAgencies({ page: p, limit: 20, sortBy: sBy, order: sOrder })
        .then(({ data, meta: m }) => {
          setList(data);
          setMeta(m);
        })
        .catch(() => toast.error("Failed to load agencies"))
        .finally(() => setLoading(false));
    },
    [page, sortBy, sortOrder]
  );

  const handleSort = useCallback(
    (newSortBy: SortField, newOrder: SortOrder) => {
      setSortBy(newSortBy);
      setSortOrder(newOrder);
      loadAgencies(page, newSortBy, newOrder);
    },
    [loadAgencies, page]
  );

  useEffect(() => {
    loadAgencies(page);
  }, [page]);

  async function handleLoginAs(agencyId: string) {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      toast.error("Session expired. Please log in again.");
      return;
    }
    try {
      const { accessToken } = await loginAsAgency(agencyId);
      const me = await getMe();
      setAuth(me.user, accessToken, refreshToken, me.permissions, me.permissionVersion);
      toast.success("Login as agency started. Redirecting to dashboard.");
      window.location.href = ROUTES.DASHBOARD;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start login as agency";
      toast.error(msg);
    }
  }

  return (
    <PageContainer title="Agencies">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <AppButton asChild>
            <Link href={ROUTES.SUPERADMIN_AGENCIES_CREATE}>Create Agency</Link>
          </AppButton>
        </div>
        <AppCard className="rounded-xl">
          {loading ? (
            <p className="text-text-secondary">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead
                      label="Name"
                      sortKey="name"
                      currentSortBy={sortBy}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Slug"
                      sortKey="slug"
                      currentSortBy={sortBy}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <TableHead>Plan</TableHead>
                    <TableHead>Users</TableHead>
                    <SortableHead
                      label="Status"
                      sortKey="status"
                      currentSortBy={sortBy}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Created"
                      sortKey="createdAt"
                      currentSortBy={sortBy}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-text-secondary">
                        No agencies
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell className="font-medium">{agency.name}</TableCell>
                        <TableCell className="text-text-secondary">{agency.slug}</TableCell>
                        <TableCell className="text-text-secondary">
                          {agency.planName
                            ? agency.planCode
                              ? `${agency.planName} (${agency.planCode})`
                              : agency.planName
                            : "—"}
                        </TableCell>
                        <TableCell>{agency.userCount ?? 0}</TableCell>
                        <TableCell>
                          <span
                            className={
                              agency.status === "ACTIVE"
                                ? "text-green-600"
                                : agency.status === "DELETED"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }
                          >
                            {agency.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {new Date(agency.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link
                              href={ROUTES.SUPERADMIN_AGENCY_EDIT(agency.id)}
                              title="Edit agency"
                              className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Link>
                            <button
                              type="button"
                              title="Login as agency"
                              className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary disabled:opacity-50 disabled:pointer-events-none"
                              onClick={() => handleLoginAs(agency.id)}
                              disabled={agency.status !== "ACTIVE"}
                            >
                              <LogIn className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {meta && meta.pages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-text-secondary">
                    Page {meta.page} of {meta.pages} ({meta.total} total)
                  </span>
                  <div className="flex gap-2">
                    <AppButton
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </AppButton>
                    <AppButton
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </AppButton>
                  </div>
                </div>
              )}
            </>
          )}
        </AppCard>
      </div>
    </PageContainer>
  );
}
