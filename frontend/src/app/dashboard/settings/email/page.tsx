"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { AppCard } from "@/components/design";
import { EmailSettingsForm } from "@/modules/settings/components/EmailSettingsForm";

export default function SettingsEmailPage() {
  return (
    <PageContainer title="Email settings">
      <AppCard className="rounded-xl p-6">
        <EmailSettingsForm />
      </AppCard>
    </PageContainer>
  );
}
