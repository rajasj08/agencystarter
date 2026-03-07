"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, AppButton } from "@/components/design";
import {
  FormProviderWrapper,
  FormInput,
  FormPassword,
  FormRootError,
} from "@/components/forms";
import { useAppForm } from "@/components/forms/useAppForm";
import { loginSchema, type LoginFormValues } from "@/validations/auth";
import { useAuthStore } from "@/store/auth";
import { login } from "@/services/auth";
import { setFormApiError } from "@/lib/formErrors";
import { ROUTES } from "@/constants/routes";

/**
 * Generic login form (email/password only). Used on /login.
 * For agency-branded login with optional SSO, use the agency login page at /agency/[agencySlug]/login.
 */
export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const form = useAppForm<typeof loginSchema>({
    schema: loginSchema,
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      const result = await login(data.email, data.password);
      setAuth(
        result.user,
        result.accessToken,
        result.refreshToken!,
        result.permissions,
        result.permissionVersion
      );
      if (result.user.forcePasswordChange) {
        router.push(ROUTES.CHANGE_PASSWORD);
        return;
      }
      let dest: string;
      if (result.user.isSuperAdmin) {
        dest = ROUTES.SUPERADMIN;
      } else if (result.user.agencyId) {
        dest = result.user.agency?.onboardingCompleted ? ROUTES.DASHBOARD : ROUTES.ONBOARDING;
      } else {
        dest = ROUTES.ONBOARDING;
      }
      router.push(dest);
    } catch (err) {
      setFormApiError<LoginFormValues>(form.setError, err, "Login failed");
    }
  }

  return (
    <AuthCard
      title="Login"
      footer={
        <>
          <AppButton
            form="login-form"
            type="submit"
            loading={form.formState.isSubmitting}
            className="shrink-0"
          >
            Sign in
          </AppButton>
          <div className="flex flex-col items-end gap-1 text-sm text-text-secondary">
            <Link href={ROUTES.FORGOT_PASSWORD} className="text-primary font-medium">
              Forgot password?
            </Link>
            <span>
              No account?{" "}
              <Link href={ROUTES.REGISTER} className="text-primary font-medium">
                Register
              </Link>
            </span>
          </div>
        </>
      }
    >
      <FormProviderWrapper form={form} id="login-form" onSubmit={onSubmit}>
        <FormRootError />
        <FormInput name="email" label="auth.email" type="email" autoComplete="email" />
        <FormPassword name="password" label="auth.password" autoComplete="current-password" />
      </FormProviderWrapper>
    </AuthCard>
  );
}
