"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppButton } from "@/components/design";
import { Card } from "@/components/ui/card";
import { useUser, useUserMutations } from "@/modules/users/hooks/useUsers";
import { ProtectedRoute } from "@/core/auth/ProtectedRoute";
import { useAuthorization } from "@/core/auth/useAuthorization";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { UserEditForm } from "@/components/users/UserEditForm";
import type { User } from "@/modules/users/types/userTypes";
import type { UserEditFormUser } from "@/components/users/UserEditForm";

function toFormUser(user: User): UserEditFormUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roleId: user.roleId,
    status: user.status,
    deletedAt: user.deletedAt,
    updatedAt: user.updatedAt,
    updatedBy: user.updatedBy
      ? { id: user.updatedBy.id, name: user.updatedBy.name, email: user.updatedBy.email }
      : null,
  };
}

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: loadingUser, error: fetchError, fetchUser } = useUser(id);
  const {
    updateUser,
    activateUser,
    suspendUser,
    disableUser,
    restoreUser,
    deleteUser: deleteUserMutation,
    resendInvite,
    sendPasswordReset,
    setPassword,
    loading: saving,
  } = useUserMutations();
  const { hasPermission } = useAuthorization();

  useEffect(() => {
    if (!id) return;
    fetchUser(id);
  }, [id, fetchUser]);

  const isDeleted = user?.deletedAt != null;
  const loading = loadingUser && !user;
  const showError = fetchError && !user;

  const handleUpdate = async (data: { name?: string; roleId?: string }) => {
    await updateUser(id, {
      name: data.name || undefined,
      roleId: data.roleId,
    });
  };

  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.USER_UPDATE}>
      {loading && (
        <div className="mx-auto max-w-[1200px]">
          <Card className="rounded-2xl shadow-sm p-6">
            <p className="text-text-secondary">Loading…</p>
          </Card>
        </div>
      )}
      {showError && (
        <div className="mx-auto max-w-[1200px]">
          <Card className="rounded-2xl shadow-sm p-6">
            <p className="text-text-secondary">{fetchError}</p>
            <AppButton variant="outline" className="mt-4" onClick={() => router.push(ROUTES.USERS)}>
              Back to Users
            </AppButton>
          </Card>
        </div>
      )}
      {!loading && !showError && user && (
        <UserEditForm
          user={toFormUser(user)}
          actions={{
            updateUser: handleUpdate,
            activateUser: (uid) => activateUser(uid),
            suspendUser: (uid) => suspendUser(uid),
            disableUser: (uid) => disableUser(uid),
            restoreUser: (uid) => restoreUser(uid),
            deleteUser: (uid) => deleteUserMutation(uid),
            resendInvite: (uid) => resendInvite(uid),
            sendPasswordReset: (uid) => sendPasswordReset(uid),
            setPassword: (uid, password) => setPassword(uid, password),
          }}
          refetchUser={() => fetchUser(id)}
          loading={saving}
          backHref={ROUTES.USERS}
          backLabel="Back to Users"
          canDelete={hasPermission(PERMISSIONS.USER_DELETE)}
          submitLabel="Save changes"
          onUpdateSuccess={() => router.push(ROUTES.USERS)}
          onDeleteSuccess={() => router.push(ROUTES.USERS)}
        />
      )}
    </ProtectedRoute>
  );
}
