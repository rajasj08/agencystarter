import { api, type ApiSuccess } from "./api";

export interface PlatformConfig {
  appName: string;
  apiPrefix: string;
  corsOrigin: string;
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  maintenanceMessage: string | null;
  maintenanceMode: boolean;
  defaultTheme: string;
}

export async function getPlatformConfig(): Promise<PlatformConfig> {
  const { data } = await api.get<ApiSuccess<PlatformConfig>>("/platform/config");
  return data.data;
}
