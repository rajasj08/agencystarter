"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { UserManagementSettingsForm } from "@/modules/settings/components/UserManagementSettingsForm";
import { getSettings, updateSettings } from "@/modules/settings/services/settingsService";
import type { AgencySettings } from "@/modules/settings/types/settingsTypes";
import { toast } from "@/lib/toast";

export default function SettingsUsersPage() {
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);
    try {
      const updated = await updateSettings(values as Partial<AgencySettings>);
      setSettings(updated);
      toast.success("User management settings saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="User management settings">
        <p className="text-text-secondary">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="User management settings">
      <UserManagementSettingsForm initialData={settings} onSubmit={handleSubmit} loading={saving} />
    </PageContainer>
  );
}
