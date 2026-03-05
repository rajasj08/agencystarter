"use client";

import type { AgencyPublicLogin } from "@/services/agency.service";
import { cn } from "@/lib/utils";

export interface AgencyLoginHeaderProps {
  agency: AgencyPublicLogin;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AgencyLoginHeader({ agency, className }: AgencyLoginHeaderProps) {
  const logoUrl = agency.logoUrl?.trim();
  const hasLogo = Boolean(logoUrl);

  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      {hasLogo && logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-16 w-16 rounded-xl object-contain"
        />
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-xl font-semibold text-muted-foreground"
          aria-hidden
        >
          {getInitials(agency.name)}
        </div>
      )}
      <div>
        <h1 className="text-lg font-semibold text-text-primary">
          Login to {agency.name}
        </h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          Sign in to your account
        </p>
      </div>
    </div>
  );
}
