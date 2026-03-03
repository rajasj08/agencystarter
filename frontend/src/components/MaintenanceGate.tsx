"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { ROLES } from "@/constants/permissions";
import { getPlatformConfig } from "@/services/platform";

interface MaintenanceGateProps {
  children: React.ReactNode;
}

/**
 * When platform config has maintenanceMode and user is not SUPER_ADMIN, show maintenance page instead of children.
 * Used in dashboard layout so /dashboard is blocked during maintenance; /login and /superadmin remain allowed.
 */
export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const user = useAuthStore((s) => s.user);
  const [maintenance, setMaintenance] = useState<{ message: string | null } | null>(null);

  useEffect(() => {
    if (user?.role === ROLES.SUPER_ADMIN) {
      setMaintenance(null);
      return;
    }
    getPlatformConfig()
      .then((config) => {
        if (config.maintenanceMode) {
          setMaintenance({ message: config.maintenanceMessage });
        } else {
          setMaintenance(null);
        }
      })
      .catch(() => setMaintenance(null));
  }, [user?.role]);

  if (maintenance) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-text-primary">Under maintenance</h1>
          <p className="mt-2 text-text-secondary">
            {maintenance.message || "We'll be back shortly. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
