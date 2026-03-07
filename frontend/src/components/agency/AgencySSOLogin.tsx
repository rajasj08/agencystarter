"use client";

import { AppButton } from "@/components/design";
import { ROUTES } from "@/constants/routes";

export interface AgencySSOLoginProps {
  agencyId: string;
  /** Agency slug for return URL so errors/success stay in agency context. */
  agencySlug?: string;
  /** Display name for the provider (e.g. "OIDC", "Google"). */
  ssoProvider: string;
}

/**
 * SSO login button for agency login page. Redirects to backend SSO initiate.
 * When agencySlug is set, return_url includes it so errors redirect back to agency login.
 */
export function AgencySSOLogin({ agencyId, agencySlug, ssoProvider }: AgencySSOLoginProps) {
  function handleClick() {
    let returnUrl = "";
    if (typeof window !== "undefined") {
      const base = `${window.location.origin}${ROUTES.LOGIN_CALLBACK}`;
      returnUrl = agencySlug
        ? `${base}?from_agency=${encodeURIComponent(agencySlug)}`
        : base;
    }
    const params = new URLSearchParams({
      agencyId,
      ...(returnUrl ? { return_url: returnUrl } : {}),
    });
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    window.location.href = `${apiBase}/auth/sso/oidc?${params.toString()}`;
  }

  const label = ssoProvider === "oidc" ? "Sign in with SSO" : `Login with ${ssoProvider}`;

  return (
    <AppButton type="button" onClick={handleClick} className="w-full">
      {label}
    </AppButton>
  );
}
