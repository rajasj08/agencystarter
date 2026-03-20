"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { logout as logoutApi } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { AppButton } from "@/components/design";

export function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearAuth();
    router.push(ROUTES.LOGIN);
  }
  return (
    <header className="min-h-header border-b border-border bg-card flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-text-secondary">
            {user.name ?? user.email}
            {user.agency && ` · ${user.agency.name}`}
          </span>
        )}
        <AppButton variant="ghost" onClick={handleLogout}>
          Logout
        </AppButton>
      </div>
    </header>
  );
}
