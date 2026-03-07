"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppButton } from "@/components/design";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormProviderWrapper,
  FormInput,
  FormSelect,
  FormRootError,
} from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { z } from "zod";
import { LastEditedSummary } from "@/components/LastEditedSummary";
import { setFormApiError } from "@/lib/formErrors";
import { toast } from "@/lib/toast";
import { RoleSelect } from "@/modules/roles";
import { UserStatusBadge } from "@/modules/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().max(255).optional(),
  roleId: z.string().min(1, "Role is required"),
});

export type UserEditFormValues = z.infer<typeof schema>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Normalized user shape for edit form (tenant User or superadmin PlatformUserDetail). */
export interface UserEditFormUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  roleId?: string | null;
  status: string;
  deletedAt?: string | null;
  updatedAt: string;
  updatedBy?: { id: string; name: string; email: string } | null;
  agencyName?: string | null;
}

/** Which actions are available for a given user state (non-deleted). */
export function getAvailableActions(user: UserEditFormUser) {
  const status = user.status;
  const isPending = status === "INVITED" || status === "PENDING_VERIFICATION";
  return {
    activate: isPending || status === "SUSPENDED" || status === "DISABLED",
    suspend: status === "ACTIVE",
    disable: isPending || status === "ACTIVE" || status === "SUSPENDED",
    resendInvite: status === "INVITED",
    sendPasswordReset:
      !isPending &&
      (status === "ACTIVE" || status === "SUSPENDED" || status === "DISABLED"),
    setPassword:
      isPending ||
      status === "ACTIVE" ||
      status === "SUSPENDED" ||
      status === "DISABLED",
    deleteUser: true,
  };
}

export interface UserEditFormActions {
  updateUser?: (data: { name?: string; roleId?: string; status?: string }) => Promise<void>;
  activateUser?: (id: string) => Promise<void>;
  suspendUser?: (id: string) => Promise<void>;
  disableUser?: (id: string) => Promise<void>;
  restoreUser?: (id: string) => Promise<void>;
  deleteUser?: (id: string) => Promise<void>;
  resendInvite?: (id: string) => Promise<void>;
  sendPasswordReset?: (id: string) => Promise<void>;
  setPassword?: (id: string, password: string) => Promise<void>;
}

export interface UserEditFormCustomAction {
  label: string;
  onClick: () => void | Promise<void>;
  loading?: boolean;
}

export interface UserEditFormProps {
  user: UserEditFormUser;
  /** When provided, use these options (e.g. superadmin agency roles). Otherwise RoleSelect fetches (tenant). */
  roleOptions?: { value: string; label: string }[];
  actions: UserEditFormActions;
  /** Refetch user after mutations (e.g. to refresh state). */
  refetchUser: () => Promise<void>;
  loading: boolean;
  backHref: string;
  backLabel: string;
  /** Whether current user can delete (e.g. USER_DELETE permission). */
  canDelete: boolean;
  /** Show Agency field at top (superadmin only). */
  showAgencyField?: boolean;
  /** Agency name to display when showAgencyField (superadmin). */
  agencyName?: string | null;
  /** Optional extra action buttons (e.g. superadmin "Generate temporary password"). */
  customActions?: UserEditFormCustomAction[];
  /** Label for form submit button. */
  submitLabel?: string;
  /** Callback after successful update (e.g. redirect). */
  onUpdateSuccess?: () => void;
  /** Callback after successful delete (e.g. redirect). */
  onDeleteSuccess?: () => void;
  /** When true, omit the form heading and description (e.g. when page already shows title like "Edit User: email"). */
  hideHeaderTitle?: boolean;
}

export function UserEditForm({
  user,
  roleOptions,
  actions,
  refetchUser,
  loading: saving,
  backHref,
  backLabel,
  canDelete,
  showAgencyField = false,
  agencyName,
  customActions = [],
  submitLabel = "Save changes",
  onUpdateSuccess,
  onDeleteSuccess,
  hideHeaderTitle = false,
}: UserEditFormProps) {
  const id = user.id;
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [setPasswordValue, setSetPasswordValue] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  const form = useAppForm<typeof schema>({
    schema,
    defaultValues: {
      name: "",
      roleId: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    const values: UserEditFormValues = {
      name: user.name ?? "",
      roleId: user.roleId ?? user.role ?? "",
    };
    form.reset(values);
  }, [user?.id, user?.roleId, user?.role, user?.name]);

  useEffect(() => {
    if (user?.roleId != null && user.roleId !== "") {
      form.setValue("roleId", user.roleId, { shouldValidate: false });
    } else if (user?.role) {
      form.setValue("roleId", user.role, { shouldValidate: false });
    }
  }, [user?.roleId, user?.role, form]);

  const isDeleted = user?.deletedAt != null;
  const isPendingStatus =
    user?.status === "INVITED" || user?.status === "PENDING_VERIFICATION";
  const actionFlags = user && !isDeleted ? getAvailableActions(user) : null;

  const handleSubmit = useCallback(
    async (data: UserEditFormValues) => {
      if (!actions.updateUser) return;
      try {
        const payload: { name?: string; roleId?: string; status?: string } = {
          name: data.name || undefined,
          roleId: data.roleId,
        };
        await actions.updateUser(payload);
        toast.success("User updated.");
        onUpdateSuccess?.();
        await refetchUser();
      } catch (err) {
        setFormApiError<UserEditFormValues>(form.setError, err, "Update user failed");
      }
    },
    [actions.updateUser, form.setError, onUpdateSuccess, refetchUser]
  );

  const handleDelete = useCallback(async () => {
    if (!actions.deleteUser) return;
    try {
      await actions.deleteUser(id);
      toast.success("User deleted.");
      setDeleteConfirmOpen(false);
      onDeleteSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }, [id, actions.deleteUser, onDeleteSuccess]);

  // —— Deleted user: read-only view with Restore only ——
  if (user && isDeleted) {
    return (
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Deleted User</h1>
            <p className="text-sm text-text-secondary">
              This user has been deleted. You can restore them to active access.
            </p>
          </div>
          <AppButton type="button" variant="outline" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </AppButton>
        </header>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">User details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              <strong>Deleted.</strong> This account is no longer active.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-text-secondary">Email</label>
                <p className="text-sm text-text-primary">{user.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Name</label>
                <p className="text-sm text-text-primary">{user.name ?? "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Role</label>
                <p className="text-sm text-text-primary">{user.role}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Deleted at</label>
                <p className="text-sm text-text-primary">
                  {user.deletedAt ? formatDate(user.deletedAt) : "—"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Deleted by</label>
                <p className="text-sm text-text-primary">
                  {user.updatedBy ? (user.updatedBy.name || user.updatedBy.email) : "—"}
                </p>
              </div>
            </div>
            <div className="pt-4">
              <AppButton
                type="button"
                variant="default"
                onClick={() => setRestoreConfirmOpen(true)}
              >
                Restore user
              </AppButton>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={restoreConfirmOpen}
          onOpenChange={(open) => !open && !saving && setRestoreConfirmOpen(false)}
        >
          <DialogContent showClose={!saving}>
            <DialogHeader>
              <DialogTitle>Restore user?</DialogTitle>
              <DialogDescription>
                Restore <strong>{user.name || user.email}</strong>? They will be able to
                sign in again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <AppButton
                type="button"
                variant="outline"
                onClick={() => setRestoreConfirmOpen(false)}
                disabled={saving}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                onClick={async () => {
                  try {
                    await actions.restoreUser?.(id);
                    toast.success("User restored.");
                    setRestoreConfirmOpen(false);
                    await refetchUser();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Restore failed");
                  }
                }}
                loading={saving}
              >
                Restore
              </AppButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // —— Non-deleted: edit form + state-based actions ——
  if (!user) return null;

  return (
    <div className="mx-auto max-w-[1200px]">
      <FormProviderWrapper form={form} onSubmit={handleSubmit} id="edit-user-form">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {!hideHeaderTitle && (
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Edit User</h1>
              <p className="text-sm text-text-secondary">
                Update role and display name. Use Admin actions below to change status (Activate, Suspend, Disable).
              </p>
            </div>
          )}
          <div className={`flex gap-2 ${hideHeaderTitle ? "sm:ml-auto" : ""}`}>
            <AppButton type="button" variant="outline" asChild>
              <Link href={backHref}>{backLabel}</Link>
            </AppButton>
          </div>
        </header>

        <FormRootError />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">User information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Email
                  </label>
                  <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-text-secondary">
                    {user.email}
                  </div>
                </div>
                <FormInput name="name" label="Display name" />
                {roleOptions ? (
                  <FormSelect
                    name="roleId"
                    label="Role"
                    options={roleOptions}
                  />
                ) : (
                  <RoleSelect name="roleId" label="Role" />
                )}

                {isPendingStatus && (
                  <div className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary">
                    <strong>Current status: Pending.</strong> This user has not completed
                    account setup yet.
                  </div>
                )}
                {actions.updateUser && (
                  <div className="pt-2">
                    <AppButton form="edit-user-form" type="submit" loading={saving}>
                      {submitLabel}
                    </AppButton>
                  </div>
                )}
              </CardContent>
            </Card>

            {(actionFlags || customActions.length > 0) && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium">Admin actions</CardTitle>
                  <p className="text-xs font-normal text-text-secondary">
                    Actions available for current state:{" "}
                    <UserStatusBadge status={user.status} />
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 p-6">
                  {actionFlags?.activate && actions.activateUser && (
                    <AppButton
                      type="button"
                      variant="default"
                      onClick={() => setActivateConfirmOpen(true)}
                    >
                      Activate user
                    </AppButton>
                  )}
                  {actionFlags?.suspend && actions.suspendUser && (
                    <AppButton
                      type="button"
                      variant="outline"
                      onClick={() => setSuspendConfirmOpen(true)}
                    >
                      Suspend user
                    </AppButton>
                  )}
                  {actionFlags?.disable && actions.disableUser && (
                    <AppButton
                      type="button"
                      variant="outline"
                      onClick={() => setDisableConfirmOpen(true)}
                    >
                      Disable user
                    </AppButton>
                  )}
                  {actionFlags?.resendInvite && actions.resendInvite && (
                    <AppButton
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await actions.resendInvite?.(id);
                          toast.success("Invitation resent.");
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Resend invite failed"
                          );
                        }
                      }}
                      loading={saving}
                    >
                      Resend invite
                    </AppButton>
                  )}
                  {actionFlags?.sendPasswordReset && actions.sendPasswordReset && (
                    <AppButton
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await actions.sendPasswordReset?.(id);
                          toast.success("Password reset email sent.");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Send failed");
                        }
                      }}
                      loading={saving}
                    >
                      Send password reset email
                    </AppButton>
                  )}
                  {actionFlags?.setPassword && actions.setPassword && (
                    <AppButton
                      type="button"
                      variant="outline"
                      onClick={() => setSetPasswordOpen(true)}
                    >
                      Set password manually
                    </AppButton>
                  )}
                  {customActions.map((ca, idx) => (
                    <AppButton
                      key={idx}
                      type="button"
                      variant="outline"
                      onClick={ca.onClick}
                      loading={ca.loading}
                    >
                      {ca.label}
                    </AppButton>
                  ))}
                  {actionFlags?.deleteUser && canDelete && actions.deleteUser && (
                    <AppButton
                      type="button"
                      variant="danger"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      Delete user
                    </AppButton>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6 lg:col-span-4">
            {showAgencyField && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium">Agency</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-text-primary">{agencyName ?? user.agencyName ?? "—"}</p>
                </CardContent>
              </Card>
            )}
            <LastEditedSummary
              updatedAt={user.updatedAt}
              updatedBy={user.updatedBy ?? undefined}
            />
          </div>
        </div>
      </FormProviderWrapper>

      {/* Set password dialog */}
      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            Set a new password for this user. Minimum 8 characters. If the user was pending,
            they will be activated.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">New password</label>
            <input
              type="password"
              value={setPasswordValue}
              onChange={(e) => setSetPasswordValue(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Min 8 characters"
              minLength={8}
            />
          </div>
          <DialogFooter>
            <AppButton
              type="button"
              variant="outline"
              onClick={() => {
                setSetPasswordOpen(false);
                setSetPasswordValue("");
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              disabled={setPasswordValue.length < 8}
              onClick={async () => {
                if (setPasswordValue.length < 8 || !actions.setPassword) return;
                try {
                  await actions.setPassword(id, setPasswordValue);
                  toast.success("Password set.");
                  setSetPasswordOpen(false);
                  setSetPasswordValue("");
                  await refetchUser();
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Set password failed"
                  );
                }
              }}
              loading={saving}
            >
              Set password
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate / Suspend / Disable / Delete confirm dialogs */}
      <Dialog
        open={activateConfirmOpen}
        onOpenChange={(open) => !open && !saving && setActivateConfirmOpen(false)}
      >
        <DialogContent showClose={!saving}>
          <DialogHeader>
            <DialogTitle>Activate user?</DialogTitle>
            <DialogDescription>
              Activate <strong>{user.name || user.email}</strong>? They will be able to sign
              in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setActivateConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              onClick={async () => {
                try {
                  await actions.activateUser?.(id);
                  toast.success("User activated.");
                  setActivateConfirmOpen(false);
                  await refetchUser();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Activate failed");
                }
              }}
              loading={saving}
            >
              Activate
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={suspendConfirmOpen}
        onOpenChange={(open) => !open && !saving && setSuspendConfirmOpen(false)}
      >
        <DialogContent showClose={!saving}>
          <DialogHeader>
            <DialogTitle>Suspend user?</DialogTitle>
            <DialogDescription>
              Suspend <strong>{user.name || user.email}</strong>? They will not be able to
              sign in until an admin activates their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setSuspendConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              onClick={async () => {
                try {
                  await actions.suspendUser?.(id);
                  toast.success("User suspended.");
                  setSuspendConfirmOpen(false);
                  await refetchUser();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Suspend failed");
                }
              }}
              loading={saving}
            >
              Suspend
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableConfirmOpen}
        onOpenChange={(open) => !open && !saving && setDisableConfirmOpen(false)}
      >
        <DialogContent showClose={!saving}>
          <DialogHeader>
            <DialogTitle>Disable user?</DialogTitle>
            <DialogDescription>
              Disable <strong>{user.name || user.email}</strong>? They will not be able to
              sign in until an admin activates their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setDisableConfirmOpen(false)}
              disabled={saving}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              onClick={async () => {
                try {
                  await actions.disableUser?.(id);
                  toast.success("User disabled.");
                  setDisableConfirmOpen(false);
                  await refetchUser();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Disable failed");
                }
              }}
              loading={saving}
            >
              Disable
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete this user? They will no longer be able to sign
            in. You can restore them later from this page.
          </p>
          <DialogFooter>
            <AppButton
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={saving}
            >
              Delete user
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
