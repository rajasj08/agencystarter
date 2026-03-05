"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AgencyLoginHeader, AgencyLoginForm, AgencySSOLogin } from "@/components/agency";
import { getAgencyBySlug, type AgencyPublicLogin } from "@/services/agency.service";
import { AppButton } from "@/components/design";
import { ROUTES } from "@/constants/routes";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "ready"; agency: AgencyPublicLogin };

export default function AgencyLoginPage() {
  const params = useParams();
  const agencySlug = typeof params.agencySlug === "string" ? params.agencySlug : "";
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    const slug = agencySlug?.trim().toLowerCase();
    if (!slug) {
      setState({ status: "not_found" });
      return;
    }
    let cancelled = false;
    getAgencyBySlug(slug)
      .then((agency) => {
        if (!cancelled) setState({ status: "ready", agency });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "not_found" });
      });
    return () => {
      cancelled = true;
    };
  }, [agencySlug]);

  if (state.status === "loading") {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-secondary">Loading…</p>
        </div>
      </AuthLayout>
    );
  }

  if (state.status === "not_found") {
    return (
      <AuthLayout>
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-text-primary">Agency not found</h1>
          <p className="mt-2 text-sm text-text-secondary">
            The agency you&apos;re looking for doesn&apos;t exist or is not available.
          </p>
          <AppButton asChild variant="outline" className="mt-4">
            <Link href={ROUTES.LOGIN}>Back to login</Link>
          </AppButton>
        </div>
      </AuthLayout>
    );
  }

  const { agency } = state;
  const ssoOnly = agency.ssoEnabled && agency.ssoEnforced;

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <AgencyLoginHeader agency={agency} />

        {agency.ssoEnabled ? (
          <>
            <AgencySSOLogin
              agencyId={agency.id}
              ssoProvider={agency.ssoProvider ?? "oidc"}
            />
            {!ssoOnly && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-text-secondary">or</span>
                  </div>
                </div>
                <AgencyLoginForm agencySlug={agencySlug} />
              </>
            )}
            {ssoOnly && (
              <p className="text-center text-sm text-text-secondary">
                Use your organization&apos;s SSO to sign in.
              </p>
            )}
          </>
        ) : (
          <AgencyLoginForm agencySlug={agencySlug} />
        )}

        <p className="text-center text-sm text-text-secondary">
          <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
            Generic login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
