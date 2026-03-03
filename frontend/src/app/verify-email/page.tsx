"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppCard, AppButton } from "@/components/design";
import { verifyEmail } from "@/services/auth";
import { ROUTES } from "@/constants/routes";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Missing verification token");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setError("Invalid or expired verification link");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "loading" || status === "idle") {
    return (
      <AuthLayout>
        <AppCard>
          <p className="text-text-secondary">Verifying your email…</p>
        </AppCard>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout>
        <AppCard title="Email verified">
          <div className="flex flex-col gap-4">
            <p className="text-text-secondary">
              Your email has been verified. You can now log in to your account.
            </p>
            <Link href={ROUTES.LOGIN}>
              <AppButton className="w-full">Log in</AppButton>
            </Link>
          </div>
        </AppCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AppCard title="Verification failed">
        <div className="flex flex-col gap-4">
          <p className="text-danger">{error}</p>
          <Link href={ROUTES.LOGIN}>
            <AppButton>Back to login</AppButton>
          </Link>
        </div>
      </AppCard>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AppCard>
            <p className="text-text-secondary">Loading…</p>
          </AppCard>
        </AuthLayout>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
