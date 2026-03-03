"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/permissions";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SuperadminSidebar } from "@/layout/SuperadminSidebar";
import { SuperadminHeader } from "@/layout/SuperadminHeader";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, accessToken, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (accessToken === null && typeof window !== "undefined") {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (user && user.role !== ROLES.SUPER_ADMIN) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, accessToken, router]);

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-nowrap bg-background">
        <SuperadminSidebar />
        <SidebarInset>
          <SuperadminHeader />
          <main className="min-h-0 flex-1 overflow-auto px-5 py-5 text-[17px]" role="main">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
