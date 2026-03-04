"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppCard, AppButton } from "@/components/design";
import {
  FormProviderWrapper,
  FormPassword,
  FormPasswordConfirm,
  FormRootError,
} from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/validations/auth";
import { resetPassword } from "@/services/auth";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const form = useAppForm<typeof resetPasswordSchema>({
    schema: resetPasswordSchema,
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) return;
    try {
      await resetPassword(token, data.password);
      setDone(true);
    } catch (err) {
      setFormApiError<ResetPasswordFormValues>(form.setError, err, "Reset failed");
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <AppCard title="Password reset">
          <p className="text-text-secondary">Your password has been reset. You can now sign in.</p>
          <Link href={ROUTES.LOGIN}>
            <AppButton className="mt-4">Sign in</AppButton>
          </Link>
        </AppCard>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout>
        <AppCard title="Invalid link">
          <p className="text-danger">Missing or invalid reset token.</p>
          <Link href={ROUTES.FORGOT_PASSWORD} className="text-primary font-medium mt-4 inline-block">
            Request a new link
          </Link>
        </AppCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AppCard
        title="Set new password"
        footer={
          <AppButton
            form="reset-form"
            type="submit"
            loading={form.formState.isSubmitting}
            className="w-full"
          >
            Reset password
          </AppButton>
        }
      >
        <FormProviderWrapper form={form} id="reset-form" onSubmit={onSubmit}>
          <FormRootError />
          <FormPassword name="password" label="auth.password" autoComplete="new-password" />
          <FormPasswordConfirm name="confirmPassword" label="auth.confirmPassword" />
        </FormProviderWrapper>
      </AppCard>
    </AuthLayout>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AppCard>
            <p className="text-text-secondary">Loading…</p>
          </AppCard>
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
