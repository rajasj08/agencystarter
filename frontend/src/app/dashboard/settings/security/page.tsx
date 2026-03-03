"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { SecuritySettingsForm } from "@/modules/settings/components/SecuritySettingsForm";

export default function SettingsSecurityPage() {
  return (
    <PageContainer title="Security settings">
      <SecuritySettingsForm />
    </PageContainer>
  );
}
