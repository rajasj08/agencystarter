"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { EmailSettingsForm } from "@/modules/settings/components/EmailSettingsForm";

export default function SettingsEmailPage() {
  return (
    <PageContainer title="Email settings">
      <EmailSettingsForm />
    </PageContainer>
  );
}
