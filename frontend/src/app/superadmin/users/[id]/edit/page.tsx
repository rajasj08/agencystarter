"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard, AppButton } from "@/components/design";
import {
  getUserById,
  disableUser,
  enableUser,
  setUserRole,
  resetUserPassword,
  type PlatformUserDetail,
} from "@/services/superadmin";
import { AgencyAutocomplete } from "@/components/superadmin/AgencyAutocomplete";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";

const ROLE_OPTIONS = [
  { value: "AGENCY_ADMIN", label: "Agency Admin" },
  { value: "AGENCY_MEMBER", label: "Agency Member" },
  { value: "USER", label: "User" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
] as const;

export default function SuperadminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<PlatformUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState<"ACTIVE" | "DISABLED">("ACTIVE");
  const [role, setRole] = useState<"AGENCY_ADMIN" | "AGENCY_MEMBER" | "USER">("USER");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setNotFound(false);
    getUserById(userId)
      .then((data) => {
        if (!data) return;
        setUser(data);
        setStatus(data.status === "ACTIVE" ? "ACTIVE" : "DISABLED");
        setRole(
          data.role === "AGENCY_ADMIN"
            ? "AGENCY_ADMIN"
            : data.role === "AGENCY_MEMBER"
              ? "AGENCY_MEMBER"
              : "USER"
        );
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const isAgencyUser = user ? !!user.agencyName : false;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  async function handleSaveStatus() {
    if (!user || status === (user.status === "ACTIVE" ? "ACTIVE" : "DISABLED")) return;
    setSaving(true);
    setError(null);
    try {
      if (status === "ACTIVE") {
        const updated = await enableUser(user.id);
        setUser((prev) => (prev ? { ...prev, status: updated.status } : null));
      } else {
        const updated = await disableUser(user.id);
        setUser((prev) => (prev ? { ...prev, status: updated.status } : null));
      }
      toast.success("Status updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRole() {
    if (!user || !isAgencyUser || role === user.role) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await setUserRole(user.id, role);
      setUser((prev) => (prev ? { ...prev, role: updated.role } : null));
      toast.success("Role updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    setResetting(true);
    setError(null);
    setTempPassword(null);
    try {
      const { temporaryPassword } = await resetUserPassword(user.id);
      setTempPassword(temporaryPassword);
      toast.success("Temporary password generated. Copy it now.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  }

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
          <AppButton
            variant="outline"
            className="mt-4"
            onClick={() => router.push(ROUTES.SUPERADMIN_USERS)}
          >
            Back to Users
          </AppButton>
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
      <AppCard className="max-w-2xl rounded-xl p-6">
        <p className="mb-6 text-sm text-text-secondary">{user.email}</p>
        {error && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-6">
          {user.agencyId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Agency</label>
              <AgencyAutocomplete
                value={user.agencyId}
                onChange={() => {}}
                placeholder="Select agency"
                activeOnly={false}
                disabled
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "DISABLED")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleSaveStatus}
              loading={saving}
              disabled={status === (user.status === "ACTIVE" ? "ACTIVE" : "DISABLED")}
            >
              Save status
            </AppButton>
          </div>
          {isAgencyUser && !isSuperAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "AGENCY_ADMIN" | "AGENCY_MEMBER" | "USER")}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleSaveRole}
                loading={saving}
                disabled={role === user.role}
              >
                Save role
              </AppButton>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Password</label>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetPassword}
              loading={resetting}
            >
              Generate temporary password
            </AppButton>
            {tempPassword && (
              <div className="mt-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Temporary password (copy now):
                </p>
                <code className="mt-1 block break-all font-mono text-sm">{tempPassword}</code>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <AppButton variant="outline" onClick={() => router.push(ROUTES.SUPERADMIN_USERS)}>
            Back to Users
          </AppButton>
        </div>
      </AppCard>
    </PageContainer>
  );
}
