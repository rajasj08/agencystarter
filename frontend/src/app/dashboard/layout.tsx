"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { AppLayout } from "@/layout/AppLayout";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/permissions";

export default function DashboardRootLayout({
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
    if (!hydrated || typeof window === "undefined") return;
    if (accessToken === null) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (!user) return;
    if (user.role === ROLES.SUPER_ADMIN && !user.impersonation) {
      router.replace(ROUTES.SUPERADMIN);
      return;
    }
    if (!user.agencyId || (user.agency && !user.agency.onboardingCompleted)) {
      router.replace(ROUTES.ONBOARDING);
    }
  }, [user, accessToken, hydrated, router]);

  if (!hydrated || (!user && !accessToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <MaintenanceGate>
      <AppLayout>{children}</AppLayout>
    </MaintenanceGate>
  );
}
