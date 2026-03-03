"use client";

import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/layout/Sidebar";
import { Header } from "@/layout/Header";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Production-grade app layout: fixed header, collapsible sidebar, scrollable content.
 * Use only for protected/dashboard routes.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-nowrap bg-background">
        <Sidebar />
        <SidebarInset>
          <ImpersonationBanner />
          <Header />
          <main className="min-h-0 flex-1 overflow-auto px-5 py-5 text-[17px]" role="main">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
