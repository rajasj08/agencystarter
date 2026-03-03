"use client";

import { AppCard } from "@/components/design";

export function SecuritySettingsForm() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Password rules, session timeout, and email verification settings will be available here.
      </p>
      <AppCard className="rounded-xl p-6">
        <p className="text-sm text-text-secondary">Security options: coming soon.</p>
      </AppCard>
    </div>
  );
}
