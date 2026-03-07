"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppButton } from "@/components/design";
import { UserTable, ViewUserModal } from "@/modules/users";
import { useUsers, useUserMutations } from "@/modules/users/hooks/useUsers";
import { useAuthorization } from "@/core/auth/useAuthorization";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { UserListFilters } from "@/components/UserListFilters";
import { PERMISSIONS } from "@/constants/permissions";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";
import type { User } from "@/modules/users/types/userTypes";

export default function UsersPage() {
  const { hasPermission } = useAuthorization();
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [restoreConfirmUser, setRestoreConfirmUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data, meta, loading, error, fetchUsers } = useUsers({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
  const { deleteUser, restoreUser } = useUserMutations();

  const load = useCallback(
    (page?: number, newSortBy?: string, newSortOrder?: "asc" | "desc", searchTerm?: string, statusFilter?: string) => {
      fetchUsers({
        page: page ?? meta.page,
        limit: meta.limit,
        sortBy: newSortBy ?? sortBy ?? "createdAt",
        sortOrder: newSortOrder ?? sortOrder,
        search: searchTerm !== undefined ? searchTerm : search,
        status: statusFilter !== undefined ? statusFilter : status,
      });
    },
    [fetchUsers, meta.page, meta.limit, sortBy, sortOrder, search, status]
  );

  useEffect(() => {
    load(1, undefined, undefined, search, status);
  }, []);

  const handleSort = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      load(meta.page, newSortBy, newSortOrder);
    },
    [load, meta.page]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      load(1, undefined, undefined, search, status);
    },
    [load, search, status]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatus(value);
      load(1, undefined, undefined, search, value);
    },
    [load, search]
  );

  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatus("");
    load(1, undefined, undefined, "", "");
  }, [load]);

  const handleDeleteRequest = useCallback((user: User) => {
    setDeleteConfirmUser(user);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmUser) return;
    setDeleting(true);
    try {
      const ok = await deleteUser(deleteConfirmUser.id);
      if (ok) {
        setDeleteConfirmUser(null);
        load(meta.page);
      }
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirmUser, deleteUser, load, meta.page]);

  const handleRestoreRequest = useCallback((user: User) => {
    setRestoreConfirmUser(user);
  }, []);

  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreConfirmUser) return;
    setRestoring(true);
    try {
      await restoreUser(restoreConfirmUser.id);
      setRestoreConfirmUser(null);
      load(meta.page);
      toast.success("User restored.");
    } catch {
      // Error already set in mutations
    } finally {
      setRestoring(false);
    }
  }, [restoreConfirmUser, restoreUser, load, meta.page]);

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_LIST}>
      <PageContainer title="Users">
        <div>
          {error && (
            <p className="mb-4 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <UserListFilters
            search={search}
            onSearchChange={setSearch}
            onSearchSubmit={handleSearchSubmit}
            status={status}
            onStatusChange={handleStatusChange}
            onReset={handleResetFilters}
            searchPlaceholder="Search by email or name…"
          >
            {hasPermission(PERMISSIONS.USER_CREATE) && (
              <AppButton asChild>
                <Link href={ROUTES.USER_CREATE}>Add User</Link>
              </AppButton>
            )}
          </UserListFilters>
          <div className="mt-4">
          <UserTable
            data={data ?? []}
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
            canEdit={hasPermission(PERMISSIONS.USER_UPDATE)}
            canDelete={hasPermission(PERMISSIONS.USER_DELETE)}
            canRestore={hasPermission(PERMISSIONS.USER_UPDATE)}
            onView={(user) => setViewUser(user)}
            onDelete={handleDeleteRequest}
            onRestore={handleRestoreRequest}
          />
          </div>
          <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && !deleting && setDeleteConfirmUser(null)}>
            <DialogContent showClose={!deleting}>
              <DialogHeader>
                <DialogTitle>Delete user?</DialogTitle>
                <DialogDescription>
                  {deleteConfirmUser && (
                    <>
                      Are you sure you want to delete <strong>{deleteConfirmUser.name || deleteConfirmUser.email}</strong>?
                      This action cannot be undone.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2">
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmUser(null)}
                  disabled={deleting}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="button"
                  variant="danger"
                  onClick={handleDeleteConfirm}
                  loading={deleting}
                  disabled={!deleteConfirmUser}
                >
                  Delete
                </AppButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={!!restoreConfirmUser} onOpenChange={(open) => !open && !restoring && setRestoreConfirmUser(null)}>
            <DialogContent showClose={!restoring}>
              <DialogHeader>
                <DialogTitle>Restore user?</DialogTitle>
                <DialogDescription>
                  {restoreConfirmUser && (
                    <>
                      Restore <strong>{restoreConfirmUser.name || restoreConfirmUser.email}</strong>? They will be able to sign in again.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 gap-2">
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => setRestoreConfirmUser(null)}
                  disabled={restoring}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="button"
                  onClick={handleRestoreConfirm}
                  loading={restoring}
                  disabled={!restoreConfirmUser}
                >
                  Restore
                </AppButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ViewUserModal
            user={viewUser}
            open={!!viewUser}
            onOpenChange={(open) => !open && setViewUser(null)}
            canEdit={hasPermission(PERMISSIONS.USER_UPDATE)}
            hideAgency
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
