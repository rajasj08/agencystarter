import { env } from "../../config/env.js";
import { API_VERSION } from "../../config/version.js";
import { getFeatureRegistry } from "../../config/features/registry.js";
import { prisma } from "../../lib/prisma.js";
import { get as getSystemConfig } from "../../services/SystemConfigCache.js";
import { SystemSettingsRepository } from "./system-settings.repository.js";

const systemSettingsRepo = new SystemSettingsRepository(prisma);

export interface PlatformConfigDTO {
  appName: string;
  apiPrefix: string;
  corsOrigin: string;
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMessage: string | null;
  maintenanceMode: boolean;
  defaultTheme: string;
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
      emailVerificationRequired: config.emailVerificationRequired,
      maintenanceMessage: config.maintenanceMessage,
      maintenanceMode: config.maintenanceMode,
      defaultTheme: config.defaultTheme,
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
    let database: "connected" | "disconnected" = "disconnected";
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "connected";
    } catch {
      database = "disconnected";
    }
    return {
      ok: database === "connected" && !env.MAINTENANCE_MODE,
      database,
      maintenance: env.MAINTENANCE_MODE,
    };
  }
}
