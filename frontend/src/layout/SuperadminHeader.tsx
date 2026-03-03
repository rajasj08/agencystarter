"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { logout as logoutApi } from "@/services/auth";
import { AppButton } from "@/components/design";
import { ROUTES } from "@/constants/routes";

export function SuperadminHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const getStoredRefreshToken = useAuthStore((s) => s.getStoredRefreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

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
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <h1 className="text-lg font-semibold text-text-primary">System Administration</h1>
      <div className="flex items-center gap-2">
        {user?.agencyId ? (
          <AppButton variant="outline" size="sm" asChild>
            <Link href={ROUTES.DASHBOARD}>Back to Dashboard</Link>
          </AppButton>
        ) : (
          <span className="text-sm text-text-secondary">Super Admin</span>
        )}
        <AppButton variant="ghost" size="sm" onClick={handleLogout} type="button">
          Logout
        </AppButton>
      </div>
    </header>
  );
}
