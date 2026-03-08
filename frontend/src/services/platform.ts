import { api, type ApiSuccess } from "./api";

export interface PlatformConfig {
  appName: string;
  apiPrefix: string;
  corsOrigin: string;
  allowRegistration: boolean;
  allowAgencyRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const { data } = await api.get<ApiSuccess<PlatformConfig>>("/platform/config");
  return data.data;
}
