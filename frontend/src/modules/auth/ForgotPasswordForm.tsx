"use client";

import Link from "next/link";
import { useState } from "react";
import { AppCard, AppButton } from "@/components/design";
import { FormProviderWrapper, FormInput, FormRootError } from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/validations/auth";
import { forgotPassword } from "@/services/auth";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const form = useAppForm<typeof forgotPasswordSchema>({
    schema: forgotPasswordSchema,
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setEmail(data.email);
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      setFormApiError<ForgotPasswordFormValues>(form.setError, err, "Request failed");
    }
  }

  if (sent) {
    return (
      <AppCard title="Check your email">
        <p className="text-text-secondary">
          If an account exists for <strong>{email}</strong>, you will receive a password reset link.
        </p>
        <Link href={ROUTES.LOGIN} className="text-primary font-medium mt-4 inline-block">
          Back to login
        </Link>
      </AppCard>
    );
  }

  return (
    <AppCard
      title="Forgot password"
      description="Enter your email to receive a reset link."
      footer={
        <AppButton
          form="forgot-form"
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
        >
          Send reset link
        </AppButton>
      }
    >
      <FormProviderWrapper form={form} id="forgot-form" onSubmit={onSubmit}>
        <FormRootError />
        <FormInput name="email" label="auth.email" type="email" autoComplete="email" />
        <p className="text-sm text-text-secondary text-center pt-2">
          <Link href={ROUTES.LOGIN} className="text-primary font-medium">
            Back to login
          </Link>
        </p>
      </FormProviderWrapper>
    </AppCard>
  );
}
