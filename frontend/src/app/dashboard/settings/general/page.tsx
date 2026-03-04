"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { GeneralSettingsForm } from "@/modules/settings/components/GeneralSettingsForm";
import { getSettings, updateSettings } from "@/modules/settings/services/settingsService";
import type { AgencySettings } from "@/modules/settings/types/settingsTypes";
import { toast } from "@/lib/toast";

export default function SettingsGeneralPage() {
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
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        payload[k] = v === "" ? null : v;
      }
      const updated = await updateSettings(payload as Parameters<typeof updateSettings>[0]);
      setSettings(updated);
      toast.success("General settings saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer title="General settings">
        <p className="text-text-secondary">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="General settings">
      <GeneralSettingsForm initialData={settings} onSubmit={handleSubmit} loading={saving} />
    </PageContainer>
  );
}
