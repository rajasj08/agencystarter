"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLinkStatusCard } from "@/components/auth/AuthLinkStatusCard";
import { isSampleLinkToken, AUTH_LINK_COPY } from "@/lib/authLinkConstants";
import { verifyEmail } from "@/services/auth";
import { getApiErrorCode } from "@/lib/apiError";
import { ROUTES } from "@/constants/routes";

const EMAIL_VERIFICATION_EXPIRED = "EMAIL_VERIFICATION_EXPIRED";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "expired" | "invalid">("idle");

  useEffect(() => {
    if (!token || isSampleLinkToken(token)) {
      setStatus("invalid");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus(getApiErrorCode(err) === EMAIL_VERIFICATION_EXPIRED ? "expired" : "invalid");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <AuthLinkStatusCard
        variant="expired"
        title={AUTH_LINK_COPY.verification.invalid.title}
        message={AUTH_LINK_COPY.verification.invalid.message}
        primaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
        secondaryAction={{ label: "Register again", href: ROUTES.REGISTER }}
      />
    );
  }

  if (isSampleLinkToken(token)) {
    return (
      <AuthLinkStatusCard
        variant="invalid"
        title={AUTH_LINK_COPY.sampleLink.title}
        message={AUTH_LINK_COPY.sampleLink.message}
        primaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
        secondaryAction={{ label: "Register", href: ROUTES.REGISTER }}
      />
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <AuthLinkStatusCard
        variant="loading"
        title=""
        message="Verifying your email…"
        primaryAction={{ label: "", href: ROUTES.LOGIN }}
      />
    );
  }

  if (status === "success") {
    return (
      <AuthLinkStatusCard
        variant="success"
        title={AUTH_LINK_COPY.verification.success.title}
        message={AUTH_LINK_COPY.verification.success.message}
        primaryAction={{ label: "Log in", href: ROUTES.LOGIN }}
      />
    );
  }

  const isExpired = status === "expired";
  return (
    <AuthLinkStatusCard
      variant="expired"
      title={isExpired ? AUTH_LINK_COPY.verification.expired.title : AUTH_LINK_COPY.verification.invalid.title}
      message={isExpired ? AUTH_LINK_COPY.verification.expired.message : AUTH_LINK_COPY.verification.invalid.message}
      primaryAction={{ label: "Back to login", href: ROUTES.LOGIN }}
      secondaryAction={{ label: "Register again", href: ROUTES.REGISTER }}
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLinkStatusCard
          variant="loading"
          title=""
          message="Loading…"
          primaryAction={{ label: "", href: ROUTES.LOGIN }}
        />
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
