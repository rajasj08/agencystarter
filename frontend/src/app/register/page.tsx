"use client";

import { AuthLayout } from "@/layouts/AuthLayout";
import { RegisterForm } from "@/modules/auth";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
