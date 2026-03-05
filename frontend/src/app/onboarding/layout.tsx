"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, isSuperAdminUser } from "@/store/auth";
import { ROUTES } from "@/constants/routes";

/**
 * Onboarding guard: platform superadmin must never access onboarding.
 * Redirect to Super Admin dashboard.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, accessToken, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !accessToken || !user) return;
    if (isSuperAdminUser(user)) {
      router.replace(ROUTES.SUPERADMIN);
    }
  }, [user, accessToken, hydrated, router]);

  return <>{children}</>;
}
