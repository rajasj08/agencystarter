"use client";

import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginForm } from "@/modules/auth";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
