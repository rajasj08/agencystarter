"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginForm } from "@/modules/auth";

function LoginContent() {
  const searchParams = useSearchParams();
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [orgUnavailable, setOrgUnavailable] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const description = searchParams.get("error_description");
    const reason = searchParams.get("reason");
    if (error === "sso_failed" && typeof window !== "undefined") {
      setSsoError(description || "SSO sign-in failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (reason === "organization_unavailable" && typeof window !== "undefined") {
      setOrgUnavailable(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  return (
    <>
      {orgUnavailable && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your organization is not available. Please contact your administrator.
        </div>
      )}
      {ssoError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {ssoError}
        </div>
      )}
      <LoginForm />
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="animate-pulse rounded bg-muted h-10 w-full max-w-sm" />}>
        <LoginContent />
      </Suspense>
    </AuthLayout>
  );
}
