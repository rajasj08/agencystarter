"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import { UserStatusBadge } from "@/modules/users";
import { useUser } from "@/modules/users/hooks/useUsers";
import { useUserMutations } from "@/modules/users/hooks/useUsers";
import { ROUTES } from "@/constants/routes";
import { useAuthorization } from "@/core/auth/useAuthorization";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { hasPermission } = useAuthorization();
  const { user, loading, error, fetchUser } = useUser(id);
  const { deleteUser, loading: deleting } = useUserMutations();

  useEffect(() => {
    if (id) fetchUser(id);
  }, [id, fetchUser]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const ok = await deleteUser(id);
    if (ok) router.push(ROUTES.USERS);
  }

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_LIST}>
      {loading && !user ? (
        <PageContainer title="User">
          <AppCard className="rounded-xl p-6">
            <p className="text-text-secondary">Loading…</p>
          </AppCard>
        </PageContainer>
      ) : error && !user ? (
        <PageContainer title="User">
          <AppCard className="rounded-xl p-6">
            <p className="text-danger" role="alert">
              {error}
            </p>
            <AppButton variant="outline" className="mt-4" asChild>
              <Link href={ROUTES.USERS}>Back to Users</Link>
            </AppButton>
          </AppCard>
        </PageContainer>
      ) : !user ? null : (
        <PageContainer
        title={user.name || user.email}
        actions={
          <div className="flex gap-2">
            {hasPermission(PERMISSIONS.USER_UPDATE) && (
              <AppButton variant="outline" asChild>
                <Link href={ROUTES.USER_EDIT(id)}>Edit</Link>
              </AppButton>
            )}
            {hasPermission(PERMISSIONS.USER_DELETE) && (
            <AppButton variant="danger" onClick={handleDelete} loading={deleting} disabled={deleting}>
              Delete
            </AppButton>
          )}
        </div>
      }
    >
      <AppCard className="max-w-2xl rounded-xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-text-secondary">Name</dt>
            <dd className="mt-1 text-sm text-text-primary">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-secondary">Email</dt>
            <dd className="mt-1 text-sm text-text-primary">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-secondary">Role</dt>
            <dd className="mt-1 text-sm text-text-primary">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-secondary">Status</dt>
            <dd className="mt-1">
              <UserStatusBadge status={user.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-secondary">Created</dt>
            <dd className="mt-1 text-sm text-text-primary">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-text-secondary">Last login</dt>
            <dd className="mt-1 text-sm text-text-primary">
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}
            </dd>
          </div>
        </dl>
      </AppCard>
    </PageContainer>
      )}
    </ProtectedRoute>
  );
}
