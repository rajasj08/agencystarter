"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const agencyName = user?.agency?.name ?? "Your Agency";

  return (
    <PageContainer title="Dashboard">
      <div className="space-y-6">
        <AppCard className="rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-text-primary">Welcome</h2>
          <p className="mt-2 text-text-secondary">
            Hello, {user?.name ?? user?.email}. You are in the dashboard.
          </p>
          {user?.agency && (
            <p className="mt-1 text-sm text-text-secondary">
              Agency: <span className="font-medium text-text-primary">{agencyName}</span>
            </p>
          )}
        </AppCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard className="rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">Total Users</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">—</p>
            <p className="mt-1 text-xs text-text-secondary">Placeholder</p>
          </AppCard>
          <AppCard className="rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">Active Sessions</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">—</p>
            <p className="mt-1 text-xs text-text-secondary">Placeholder</p>
          </AppCard>
          <AppCard className="rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">Pending Tasks</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">—</p>
            <p className="mt-1 text-xs text-text-secondary">Placeholder</p>
          </AppCard>
          <AppCard className="rounded-xl p-6 shadow-sm">
            <p className="text-sm font-medium text-text-secondary">Storage Used</p>
            <p className="mt-2 text-2xl font-semibold text-text-primary">—</p>
            <p className="mt-1 text-xs text-text-secondary">Placeholder</p>
          </AppCard>
        </div>
      </div>
    </PageContainer>
  );
}
