"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AuthCard, AppButton } from "@/components/design";
import {
  FormProviderWrapper,
  FormPassword,
  FormPasswordConfirm,
  FormRootError,
} from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { AuthLinkStatusCard } from "@/components/auth/AuthLinkStatusCard";
import { isSampleLinkToken } from "@/lib/authLinkConstants";
import { AUTH_LINK_COPY } from "@/lib/authLinkConstants";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/validations/auth";
import { validateResetToken, resetPassword } from "@/services/auth";
import { setFormApiError } from "@/lib/formErrors";
import { getApiErrorCode } from "@/lib/apiError";
import { ROUTES } from "@/constants/routes";

const PASSWORD_RESET_EXPIRED = "PASSWORD_RESET_EXPIRED";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);
  const [linkStatus, setLinkStatus] = useState<"expired" | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const form = useAppForm<typeof resetPasswordSchema>({
    schema: resetPasswordSchema,
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token || isSampleLinkToken(token)) {
      setTokenValid(false);
      return;
    }
    let cancelled = false;
    setTokenValid(null);
    validateResetToken(token)
      .then((res) => {
        if (!cancelled) setTokenValid(res.valid);
      })
      .catch(() => {
        if (!cancelled) setTokenValid(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) return;
    try {
      await resetPassword(token, data.password);
      setDone(true);
    } catch (err) {
      if (getApiErrorCode(err) === PASSWORD_RESET_EXPIRED) {
        setLinkStatus("expired");
      } else {
        setFormApiError<ResetPasswordFormValues>(form.setError, err, "Reset failed");
      }
    }
  }

  if (done) {
    return (
      <AuthLinkStatusCard
        variant="success"
        title={AUTH_LINK_COPY.resetPassword.success.title}
        message={AUTH_LINK_COPY.resetPassword.success.message}
        primaryAction={{ label: "Sign in", href: ROUTES.LOGIN }}
      />
    );
  }

  if (linkStatus === "expired") {
    return (
      <AuthLinkStatusCard
        variant="expired"
        title={AUTH_LINK_COPY.resetPassword.expiredAfterSubmit.title}
        message={AUTH_LINK_COPY.resetPassword.expiredAfterSubmit.message}
        primaryAction={{ label: "Request a new link", href: ROUTES.FORGOT_PASSWORD }}
        secondaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
      />
    );
  }

  if (!token) {
    return (
      <AuthLinkStatusCard
        variant="invalid"
        title={AUTH_LINK_COPY.resetPassword.noToken.title}
        message={AUTH_LINK_COPY.resetPassword.noToken.message}
        primaryAction={{ label: "Request a new link", href: ROUTES.FORGOT_PASSWORD }}
        secondaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
      />
    );
  }

  if (isSampleLinkToken(token)) {
    return (
      <AuthLinkStatusCard
        variant="invalid"
        title={AUTH_LINK_COPY.sampleLink.title}
        message={AUTH_LINK_COPY.sampleLink.message}
        primaryAction={{ label: "Request a new link", href: ROUTES.FORGOT_PASSWORD }}
        secondaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
      />
    );
  }

  if (tokenValid === null) {
    return (
      <AuthLinkStatusCard
        variant="loading"
        title=""
        message={AUTH_LINK_COPY.loading.message}
        primaryAction={{ label: "", href: ROUTES.LOGIN }}
      />
    );
  }

  if (tokenValid === false) {
    return (
      <AuthLinkStatusCard
        variant="expired"
        title={AUTH_LINK_COPY.resetPassword.invalid.title}
        message={AUTH_LINK_COPY.resetPassword.invalid.message}
        primaryAction={{ label: "Request a new link", href: ROUTES.FORGOT_PASSWORD }}
        secondaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
      />
    );
  }

  return (
    <AuthLayout>
      <AuthCard
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
      </AuthCard>
    </AuthLayout>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AuthLinkStatusCard
          variant="loading"
          title=""
          message="Loading…"
          primaryAction={{ label: "", href: ROUTES.LOGIN }}
        />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
