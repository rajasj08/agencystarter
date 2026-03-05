"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, isSuperAdminUser } from "@/store/auth";
import { ROUTES } from "@/constants/routes";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SuperadminSidebar } from "@/layout/SuperadminSidebar";
import { SuperadminHeader } from "@/layout/SuperadminHeader";

export default function SuperadminLayout({
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
    if (user && !isSuperAdminUser(user)) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, accessToken, hydrated, router]);

  if (!hydrated || !user || !isSuperAdminUser(user)) {
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
          <main className="min-h-0 flex-1 overflow-auto px-6 py-6 text-[17px]" role="main">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
