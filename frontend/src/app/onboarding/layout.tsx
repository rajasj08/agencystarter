"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/permissions";

/**
 * Onboarding guard: SUPER_ADMIN must never access onboarding.
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
    if (user.role === ROLES.SUPER_ADMIN) {
      router.replace(ROUTES.SUPERADMIN);
    }
  }, [user, accessToken, hydrated, router]);

  return <>{children}</>;
}
