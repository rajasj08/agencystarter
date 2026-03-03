"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { stopImpersonation } from "@/services/superadmin";
import { getMe } from "@/services/auth";
import { AppButton } from "@/components/design";
import { ROUTES } from "@/constants/routes";
import { toast } from "@/lib/toast";

export function ImpersonationBanner() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setTokens = useAuthStore((s) => s.setTokens);
  const getStoredRefreshToken = useAuthStore((s) => s.getStoredRefreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  if (!user?.impersonation || !user?.impersonatingAgency) return null;

  async function handleExit() {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      toast.error("Session expired. Please log in again.");
      return;
    }
    setExiting(true);
    try {
      const { accessToken } = await stopImpersonation();
      setTokens(accessToken, refreshToken);
      const updatedUser = await getMe();
      setUser(updatedUser);
      setAuth(updatedUser, accessToken, refreshToken);
      toast.success("Impersonation ended.");
      router.push(ROUTES.SUPERADMIN);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to exit impersonation";
      toast.error(msg);
    } finally {
      setExiting(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 bg-amber-500/90 px-5 py-2 text-sm font-medium text-amber-950">
      <span>
        Impersonating agency: <strong>{user.impersonatingAgency.name}</strong>
      </span>
      <AppButton
        variant="outline"
        size="sm"
        onClick={handleExit}
        disabled={exiting}
        className="border-amber-700 bg-white/90 hover:bg-white"
      >
        {exiting ? "Exiting…" : "Exit Impersonation"}
      </AppButton>
    </div>
  );
}
