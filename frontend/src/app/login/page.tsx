"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginForm } from "@/modules/auth";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [ssoError, setSsoError] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const description = searchParams.get("error_description");
    if (error === "sso_failed" && typeof window !== "undefined") {
      setSsoError(description || "SSO sign-in failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  return (
    <AuthLayout>
      {ssoError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {ssoError}
        </div>
      )}
      <LoginForm />
    </AuthLayout>
  );
}
