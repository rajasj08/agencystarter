"use client";

import { AuthLayout } from "@/layouts/AuthLayout";
import { ForgotPasswordForm } from "@/modules/auth";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
