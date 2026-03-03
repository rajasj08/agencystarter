"use client";

import { useRouter } from "next/navigation";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { logout as logoutApi } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { AppButton } from "@/components/design";

/**
 * Classic SaaS header: toggle (left), page title (center), user + logout (right).
 * Future: notifications, tenant switcher, search.
 */
export function Header() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const { user, refreshToken, clearAuth, getStoredRefreshToken } = useAuthStore();

  async function handleLogout() {
    const token = refreshToken ?? getStoredRefreshToken();
    if (token) {
      try {
        await logoutApi(token);
      } catch {
        // ignore
      }
    }
    clearAuth();
    router.push(ROUTES.LOGIN);
  }

  return (
    <header
      className="min-h-header sticky top-0 z-40 flex shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6"
      role="banner"
    >
      <div className="flex h-full min-h-[3.5rem] items-center gap-2">
        <SidebarTrigger aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </SidebarTrigger>
      </div>
      <div className="flex min-w-0 flex-1 justify-center">
        <h1 className="truncate text-lg font-medium text-text-primary">
          <span className="sr-only">Page title</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden truncate text-sm text-text-secondary sm:inline">
            {user.name ?? user.email}
            {user.agency && ` · ${user.agency.name}`}
          </span>
        )}
        <AppButton variant="ghost" onClick={handleLogout} type="button">
          Logout
        </AppButton>
      </div>
    </header>
  );
}
