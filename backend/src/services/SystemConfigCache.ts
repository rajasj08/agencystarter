/**
 * In-memory cache of system settings. Loaded on startup and refreshed when superadmin updates settings.
 * Use get() for reads; call refresh() after updating system settings or on startup.
 */

import { getPrismaForInternalUse } from "../lib/data-access.js";

export interface SystemConfig {
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMessage: string | null;
  defaultTheme: string;
  allowAgencyRegistration: boolean;
  maxUsersPerAgency: number | null;
  defaultTimezone: string;
  maintenanceMode: boolean;
}

const DEFAULTS: SystemConfig = {
  allowRegistration: true,
  emailVerificationRequired: false,
  maintenanceMessage: null,
  defaultTheme: "light",
  allowAgencyRegistration: true,
  maxUsersPerAgency: null,
  defaultTimezone: "UTC",
  maintenanceMode: false,
};

let cache: SystemConfig = { ...DEFAULTS };

export async function refresh(): Promise<SystemConfig> {
  const prisma = getPrismaForInternalUse();
  const row = await prisma.systemSettings.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!row) {
    cache = { ...DEFAULTS };
    return cache;
  }
  cache = {
    allowRegistration: row.allowRegistration,
    emailVerificationRequired: row.emailVerificationRequired,
    maintenanceMessage: row.maintenanceMessage,
    defaultTheme: row.defaultTheme,
    allowAgencyRegistration: row.allowAgencyRegistration,
    maxUsersPerAgency: row.maxUsersPerAgency,
    defaultTimezone: row.defaultTimezone,
    maintenanceMode: row.maintenanceMode,
  };
  return cache;
}

export function get(): SystemConfig {
  return { ...cache };
}
