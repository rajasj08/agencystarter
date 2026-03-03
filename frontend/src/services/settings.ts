import { api, type ApiSuccess } from "./api";

export interface AgencySettings {
  logo?: string | null;
  timezone?: string | null;
  language?: string | null;
  theme?: "light" | "dark" | "system" | null;
}

export async function getSettings() {
  const { data } = await api.get<ApiSuccess<AgencySettings>>("/settings");
  return data.data;
}

export async function updateSettings(payload: Partial<AgencySettings>) {
  const { data } = await api.patch<ApiSuccess<AgencySettings>>("/settings", payload);
  return data.data;
}
