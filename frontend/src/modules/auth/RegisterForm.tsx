"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppCard, AppButton } from "@/components/design";
import {
  FormProviderWrapper,
  FormInput,
  FormPassword,
  FormPasswordConfirm,
  FormRootError,
} from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { registerSchema, type RegisterFormValues } from "@/validations/auth";
import { useAuthStore } from "@/store/auth";
import { register } from "@/services/auth";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [verificationSent, setVerificationSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const form = useAppForm<typeof registerSchema>({
    schema: registerSchema,
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setSubmittedEmail(data.email);
    try {
      const result = await register(
        data.email,
        data.password,
        data.confirmPassword,
        data.name || undefined
      );
      if ("accessToken" in result && result.accessToken) {
        setAuth(result.user, result.accessToken, result.refreshToken);
        router.push(result.user.agencyId ? ROUTES.DASHBOARD : ROUTES.ONBOARDING);
      } else {
        setVerificationSent(true);
      }
    } catch (err) {
      setFormApiError<RegisterFormValues>(form.setError, err, "Registration failed");
    }
  }

  if (verificationSent) {
    return (
      <AppCard title="Check your email">
        <p className="text-text-secondary">
          We sent a verification link to <strong>{submittedEmail}</strong>. Click the link to activate your account.
        </p>
        <Link href={ROUTES.LOGIN} className="text-primary font-medium mt-4 inline-block">
          Back to login
        </Link>
      </AppCard>
    );
  }

  return (
    <AppCard
      title="Register"
      footer={
        <>
          <AppButton
            form="register-form"
            type="submit"
            loading={form.formState.isSubmitting}
            className="shrink-0"
          >
            Create account
          </AppButton>
          <p className="text-sm text-text-secondary text-right">
            Already have an account?{" "}
            <Link href={ROUTES.LOGIN} className="text-primary font-medium">
              Login
            </Link>
          </p>
        </>
      }
    >
      <FormProviderWrapper
        form={form}
        id="register-form"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormRootError />
        <FormInput name="email" label="auth.email" type="email" autoComplete="email" />
        <FormInput name="name" label="auth.name" type="text" autoComplete="name" />
        <FormPassword name="password" label="auth.password" autoComplete="new-password" />
        <FormPasswordConfirm name="confirmPassword" label="auth.confirmPassword" />
      </FormProviderWrapper>
    </AppCard>
  );
}
