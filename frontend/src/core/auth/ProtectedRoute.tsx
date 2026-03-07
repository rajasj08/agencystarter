"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, isSuperAdminUser } from "@/store/auth";
import { hasAnyPermission, hasCapability } from "@/core/auth/authorization";
import { reportAccessDenied } from "@/core/auth/telemetry-403";
import { ROUTES } from "@/constants/routes";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required permission(s): user must have at least one. Omit to only require auth. */
  requiredPermission?: string | string[];
  /** Required plan/feature capability. Both permission and capability must pass if provided. */
  requiredCapability?: string;
  /** When true, do not render children until auth + permission check done (avoids flash). */
  blockUntilReady?: boolean;
}

/**
 * Protects a page: redirects to login if not authenticated, to /403 if no permission/capability.
 * Blocks render until check; then redirects. Fires 403 telemetry when access denied.
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredCapability,
  blockUntilReady = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const userCapabilities = useAuthStore((s) => s.userCapabilities);
  const hydrated = useAuthStore((s) => s.hydrated);
  const telemetryFired = useRef(false);

  const isSuperAdmin = isSuperAdminUser(user);
  const hasPermission =
    !requiredPermission ||
    hasAnyPermission(permissions, requiredPermission, isSuperAdmin);
  const hasCap =
    !requiredCapability ||
    hasCapability(userCapabilities, requiredCapability);
  const hasAccess = hasPermission && hasCap;

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (user.forcePasswordChange && pathname !== ROUTES.CHANGE_PASSWORD) {
      router.replace(ROUTES.CHANGE_PASSWORD);
      return;
    }
    if (!hasAccess) {
      if (!telemetryFired.current) {
        reportAccessDenied({
          userId: user.id,
          agencyId: user.agencyId,
          route: pathname ?? window.location?.pathname ?? "",
          requiredPermission,
          requiredCapability,
          timestamp: Date.now(),
        });
        telemetryFired.current = true;
      }
      router.replace("/403");
    }
  }, [hydrated, user, hasAccess, router, pathname, requiredPermission, requiredCapability]);

  if (!hydrated && blockUntilReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }

  if (!user) return null;
  if (!hasAccess) return null;

  return <>{children}</>;
}
