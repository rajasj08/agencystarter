"use client";

import { useEffect, useState } from "react";
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
  getUsers,
  disableUser,
  enableUser,
  setUserRole,
  resetUserPassword,
  type PlatformUserListItem,
} from "@/services/superadmin";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";
import { Pencil, UserPlus } from "lucide-react";

export default function SuperadminUsersPage() {
  const [list, setList] = useState<PlatformUserListItem[]>([]);
  const [meta, setMeta] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  function loadUsers(p = page, searchTerm = search) {
    setLoading(true);
    getUsers({
      page: p,
      limit: 20,
      search: searchTerm || undefined,
      sortBy: "createdAt",
      order: "desc",
    })
      .then(({ data, meta: m }) => {
        setList(data);
        setMeta(m);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers(page, search);
  }, [page]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadUsers(1, search);
  }

  async function handleDisable(userId: string) {
    try {
      await disableUser(userId);
      setList((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "DISABLED" } : u)));
      toast.success("User disabled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disable user");
    }
  }

  async function handleEnable(userId: string) {
    try {
      await enableUser(userId);
      setList((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" } : u)));
      toast.success("User enabled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enable user");
    }
  }

  async function handleRoleChange(userId: string, role: "AGENCY_ADMIN" | "AGENCY_MEMBER" | "USER") {
    try {
      await setUserRole(userId, role);
      setList((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success("Role updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    }
  }

  async function handleResetPassword(userId: string) {
    const { temporaryPassword } = await resetUserPassword(userId);
    toast.success("Temporary password generated. Copy it now.");
    return { temporaryPassword };
  }

  const isSuperAdmin = (u: PlatformUserListItem) => u.role === "SUPER_ADMIN";

  return (
    <PageContainer title="Platform Users">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="search"
            placeholder="Search by email or name..."
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <AppButton type="submit" variant="outline">
            Search
          </AppButton>
        </form>
          <AppButton asChild>
            <Link href={ROUTES.SUPERADMIN_USERS_CREATE}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden />
              Add user
            </Link>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-text-secondary">
                        No users
                      </TableCell>
                    </TableRow>
                  ) : (
                    list.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell className="text-text-secondary">{user.name ?? "—"}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-text-secondary">{user.agencyName ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={
                              user.status === "ACTIVE"
                                ? "text-green-600"
                                : user.status === "DISABLED"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }
                          >
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {isSuperAdmin(user) ? (
                            <span className="text-sm text-text-secondary">—</span>
                          ) : (
                            <Link
                              href={ROUTES.SUPERADMIN_USER_EDIT(user.id)}
                              title="Edit user"
                              className="rounded-md p-2 text-text-secondary hover:bg-muted hover:text-text-primary"
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Link>
                          )}
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
