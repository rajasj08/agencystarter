/**
 * Fire analytics when ProtectedRoute blocks access (403).
 * Do not block UI if this fails.
 */

export interface AccessDeniedPayload {
  userId: string | null;
  agencyId: string | null;
  route: string;
  requiredPermission?: string | string[];
  requiredCapability?: string;
  timestamp: number;
}

export function reportAccessDenied(payload: AccessDeniedPayload): void {
  try {
    if (typeof window === "undefined") return;
    // Plug in your analytics (e.g. window.gtag, segment, post to /api/telemetry)
    if (typeof (window as unknown as { __analytics?: { accessDenied: (p: AccessDeniedPayload) => void } }).__analytics?.accessDenied === "function") {
      (window as unknown as { __analytics: { accessDenied: (p: AccessDeniedPayload) => void } }).__analytics.accessDenied(payload);
    }
    // Optional: console in development
    if (process.env.NODE_ENV === "development") {
      console.warn("[auth] Access denied:", payload);
    }
  } catch {
    // Do not block UI
  }
}
