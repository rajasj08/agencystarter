"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants/routes";

function parseHashParams(hash: string): Record<string, string> {
  const trimmed = hash.replace(/^#?/, "").trim();
  if (!trimmed) return {};
  const out: Record<string, string> = {};
  for (const part of trimmed.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq).replace(/\+/g, " "));
    const value = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " "));
    out[key] = value;
  }
  return out;
}

export default function LoginCallbackPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawHash = window.location.hash;
    const params = parseHashParams(rawHash);

    const accessToken = params.access_token?.trim();
    const refreshToken = params.refresh_token?.trim();
    const error = params.error?.trim();
    const errorDescription = params.error_description?.trim();

    const hasTokens = Boolean(accessToken);
    const hasError = Boolean(error);

    if (!hasTokens && !hasError) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (hasError) {
      setErrorMessage(errorDescription || error || "SSO sign-in failed");
      setStatus("error");
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

    setTokens(accessToken!, refreshToken || undefined);

    getMe()
      .then((me) => {
        setAuth(
          me.user,
          accessToken!,
          refreshToken || accessToken!,
          me.permissions,
          me.permissionVersion
        );
        setStatus("success");
        if (me.user.isSuperAdmin) {
          router.replace(ROUTES.SUPERADMIN);
        } else if (me.user.agencyId && me.user.agency?.onboardingCompleted) {
          router.replace(ROUTES.DASHBOARD);
        } else {
          router.replace(ROUTES.ONBOARDING);
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Could not load your account. Please try again.");
      });
  }, [router, setTokens, setAuth]);

  if (status === "error") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-4">
        <p className="text-center text-text-secondary">{errorMessage}</p>
        <a href={ROUTES.LOGIN} className="text-primary font-medium underline">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-4">
      <p className="text-center text-text-secondary">Signing you in…</p>
    </div>
  );
}
