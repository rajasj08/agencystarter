"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { getAgencies, getSystemSettings } from "@/services/superadmin";

export default function SuperadminOverviewPage() {
  const [agencyCount, setAgencyCount] = useState<number | null>(null);
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof getSystemSettings>> | null>(null);

  useEffect(() => {
    getAgencies().then((list) => setAgencyCount(list.length));
    getSystemSettings().then(setSettings);
  }, []);

  return (
    <PageContainer title="Overview">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard title="Agencies" className="rounded-xl">
          <p className="text-2xl font-semibold text-text-primary">
            {agencyCount !== null ? agencyCount : "—"}
          </p>
          <p className="text-sm text-text-secondary">Total agencies on the platform</p>
        </AppCard>
        <AppCard title="User registration" className="rounded-xl">
          <p className="text-lg font-medium text-text-primary">
            {settings?.allowRegistration ? "Enabled" : "Disabled"}
          </p>
          <p className="text-sm text-text-secondary">Allow new user sign-ups</p>
        </AppCard>
        <AppCard title="Agency registration" className="rounded-xl">
          <p className="text-lg font-medium text-text-primary">
            {settings?.allowAgencyRegistration ? "Enabled" : "Disabled"}
          </p>
          <p className="text-sm text-text-secondary">Allow new agency creation</p>
        </AppCard>
        <AppCard title="Maintenance mode" className="rounded-xl">
          <p className="text-lg font-medium text-text-primary">
            {settings?.maintenanceMode ? "On" : "Off"}
          </p>
          <p className="text-sm text-text-secondary">System-wide maintenance</p>
        </AppCard>
      </div>
    </PageContainer>
  );
}
