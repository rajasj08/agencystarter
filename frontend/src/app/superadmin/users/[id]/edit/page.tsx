"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getUserById,
  setUserRole,
  setUserStatus,
  resetUserPassword,
  sendPasswordReset,
  deleteUser,
  restoreUser,
  getAgencyRoles,
  type PlatformUserDetail,
} from "@/services/superadmin";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import { UserEditForm } from "@/components/users/UserEditForm";
import type { UserEditFormUser } from "@/components/users/UserEditForm";

function toFormUser(u: PlatformUserDetail): UserEditFormUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.displayName ?? null,
    role: u.role,
    roleId: u.role,
    status: u.status,
    deletedAt: u.deletedAt,
    updatedAt: u.updatedAt,
    updatedBy: null,
    agencyName: u.agencyName ?? null,
  };
}

export default function SuperadminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<PlatformUserDetail | null>(null);
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPasswordDialogOpen, setTempPasswordDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setNotFound(false);
    try {
      const data = await getUserById(userId);
      if (data) setUser(data);
      else setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loadAgencyRoles = useCallback(async (agencyId: string) => {
    try {
      const roles = await getAgencyRoles(agencyId);
      setRoleOptions(roles.map((r) => ({ value: r.name, label: r.name })));
    } catch {
      setRoleOptions([]);
    }
  }, []);

  useEffect(() => {
    if (user?.agencyId) loadAgencyRoles(user.agencyId);
    else setRoleOptions([]);
  }, [user?.agencyId, loadAgencyRoles]);

  const isSuperAdminUser = user?.role === "SUPER_ADMIN";
  const isCurrentUser = user?.id === currentUser?.id;
  const canModify = !isSuperAdminUser && user?.id !== currentUser?.id;

  const handleUpdate = useCallback(
    async (data: { name?: string; roleId?: string }) => {
      if (!user || user.deletedAt) return;
      setSaving(true);
      try {
        if (data.roleId && data.roleId !== user.role) {
          const updated = await setUserRole(user.id, data.roleId);
          setUser(updated);
        }
        await fetchUser();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      } finally {
        setSaving(false);
      }
    },
    [user, fetchUser]
  );

  const handleOpenTempPasswordDialog = useCallback(() => {
    setTempPassword(null);
    setTempPasswordDialogOpen(true);
  }, []);

  const handleGenerateTempPassword = useCallback(async () => {
    if (!user) return;
    setResetting(true);
    setTempPassword(null);
    try {
      const { temporaryPassword } = await resetUserPassword(user.id);
      setTempPassword(temporaryPassword);
      toast.success("Temporary password generated. Copy it now.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  }, [user]);

  const handleCloseTempPasswordDialog = useCallback(() => {
    setTempPasswordDialogOpen(false);
    setTempPassword(null);
  }, []);

  if (loading && !user) {
    return (
      <PageContainer title="Edit User">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">Loading…</p>
        </AppCard>
      </PageContainer>
    );
  }

  if (notFound || !user) {
    return (
      <PageContainer title="Edit User">
        <AppCard className="rounded-xl p-6">
          <p className="text-text-secondary">User not found.</p>
          <Link
            href={ROUTES.SUPERADMIN_USERS}
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to Users
          </Link>
        </AppCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Edit User: ${user.email}`}
      breadcrumbs={[
        { label: "Superadmin", href: ROUTES.SUPERADMIN },
        { label: "Platform Users", href: ROUTES.SUPERADMIN_USERS },
        { label: "Edit" },
      ]}
    >
      <UserEditForm
        user={toFormUser(user)}
        hideHeaderTitle
        roleOptions={
          roleOptions.length > 0
            ? roleOptions
            : user.role
              ? [{ value: user.role, label: user.role }]
              : []
        }
        actions={{
          updateUser: canModify ? handleUpdate : undefined,
          activateUser: canModify
            ? (id) => setUserStatus(id, "ACTIVE").then(setUser)
            : undefined,
          suspendUser: canModify
            ? (id) => setUserStatus(id, "SUSPENDED").then(setUser)
            : undefined,
          disableUser: canModify
            ? (id) => setUserStatus(id, "DISABLED").then(setUser)
            : undefined,
          restoreUser: canModify ? (id) => restoreUser(id).then(setUser) : undefined,
          deleteUser: canModify ? (id) => deleteUser(id) : undefined,
          sendPasswordReset: canModify
            ? (id) => sendPasswordReset(id).then(() => fetchUser())
            : undefined,
        }}
        refetchUser={fetchUser}
        loading={saving}
        backHref={ROUTES.SUPERADMIN_USERS}
        backLabel="Back to Users"
        canDelete={canModify}
        showAgencyField={true}
        agencyName={user.agencyName ?? null}
        customActions={
          canModify && !user.deletedAt
            ? [
                {
                  label: "Generate temporary password",
                  onClick: handleOpenTempPasswordDialog,
                  loading: false,
                },
              ]
            : []
        }
        submitLabel="Save changes"
        onUpdateSuccess={() => {}}
        onDeleteSuccess={() => router.push(ROUTES.SUPERADMIN_USERS)}
      />

      <Dialog open={tempPasswordDialogOpen} onOpenChange={(open) => !open && handleCloseTempPasswordDialog()}>
        <DialogContent showClose={!resetting}>
          <DialogHeader>
            <DialogTitle>Generate temporary password</DialogTitle>
            <DialogDescription>
              Generate a one-time temporary password for this user. They will be required to change
              it on next login. The password will only be shown once in this dialog.
            </DialogDescription>
          </DialogHeader>
          {!tempPassword ? (
            <DialogFooter>
              <AppButton
                type="button"
                onClick={handleGenerateTempPassword}
                loading={resetting}
                disabled={resetting}
              >
                Generate temporary password
              </AppButton>
            </DialogFooter>
          ) : (
            <>
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
                  <code className="block break-all font-mono text-sm">{tempPassword}</code>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  ⚠ This password will only be shown once. Make sure you save it now and share it
                  with the user securely.
                </p>
              </div>
              <DialogFooter>
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(tempPassword);
                    toast.success("Copied to clipboard");
                  }}
                >
                  Copy password
                </AppButton>
                <AppButton type="button" onClick={handleCloseTempPasswordDialog}>
                  I copied it
                </AppButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
