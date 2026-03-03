"use client";

import { AuthLayout } from "@/layouts/AuthLayout";
import { OnboardingForm } from "@/modules/auth";

export default function OnboardingPage() {
  return (
    <AuthLayout>
      <OnboardingForm />
    </AuthLayout>
  );
}
