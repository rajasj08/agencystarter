"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/design";
import { PasswordForm } from "@/modules/profile/components/PasswordForm";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants/routes";

export default function ChangePasswordPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !user) router.replace(ROUTES.LOGIN);
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <AuthCard className="w-full max-w-md" title="Change your password">
        <p className="mb-6 text-sm text-text-secondary">
          An administrator set a temporary password for your account. You must choose a new password
          before you can continue.
        </p>
        <PasswordForm
          onSuccess={(response) => {
            if (response.user) setUser(response.user);
            if (response.user?.isSuperAdmin) {
              router.replace(ROUTES.SUPERADMIN);
            } else {
              router.replace(ROUTES.DASHBOARD);
            }
          }}
        />
        <p className="mt-4 text-center text-sm text-text-secondary">
          <Link href={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
