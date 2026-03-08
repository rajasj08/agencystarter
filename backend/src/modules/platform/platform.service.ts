import { env } from "../../config/env.js";
import { API_VERSION } from "../../config/version.js";
import { getFeatureRegistry } from "../../config/features/registry.js";
import { get as getSystemConfig } from "../../services/SystemConfigCache.js";

/** Public platform config for frontend. Only policy flags and maintenance; no limits (e.g. maxUsersPerAgency). */
export interface PlatformConfigDTO {
  appName: string;
  apiPrefix: string;
  corsOrigin: string;
  allowRegistration: boolean;
  allowAgencyRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

export interface PlatformFeaturesDTO {
  features: Array<{ name: string; description: string; enabled: boolean }>;
}

export interface PlatformVersionDTO {
  version: string;
  environment: string;
}

export class PlatformService {
  async getConfig(): Promise<PlatformConfigDTO> {
    const config = getSystemConfig();
    return {
      appName: env.APP_NAME,
      apiPrefix: env.API_PREFIX,
      corsOrigin: env.CORS_ORIGIN,
      allowRegistration: config.allowRegistration,
      allowAgencyRegistration: config.allowAgencyRegistration,
      emailVerificationRequired: config.emailVerificationRequired,
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
    };
  }

  async getFeatures(): Promise<PlatformFeaturesDTO> {
    const registry = getFeatureRegistry();
    return {
      features: registry.map((f) => ({ name: f.name, description: f.description, enabled: f.enabled })),
    };
  }

  async getVersion(): Promise<PlatformVersionDTO> {
    return {
      version: API_VERSION,
      environment: env.NODE_ENV,
    };
  }

  /** Aggregate health: db + app. For platform/health or config. */
  async getSystemHealth(): Promise<{ ok: boolean; database: string; maintenance: boolean }> {
    const { checkDatabase } = await import("../../lib/data-access.js");
    const database: "connected" | "disconnected" = (await checkDatabase()) ? "connected" : "disconnected";
    return {
      ok: database === "connected" && !env.MAINTENANCE_MODE,
      database,
      maintenance: env.MAINTENANCE_MODE,
    };
  }
}
