/**
 * Settings API. GET/PATCH /settings (agency-scoped). POST /settings/test-email.
 */

import { api, type ApiSuccess } from "@/services/api";
import type { AgencySettings, SettingsUpdateInput } from "../types/settingsTypes";

export async function getSettings(): Promise<AgencySettings> {
  const { data } = await api.get<ApiSuccess<AgencySettings>>("/settings");
  return data.data;
}

export async function updateSettings(payload: SettingsUpdateInput): Promise<AgencySettings> {
  const { data } = await api.patch<ApiSuccess<AgencySettings>>("/settings", payload);
  return data.data;
}

export async function sendTestEmail(to: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiSuccess<{ message: string }>>("/settings/test-email", { to });
  return data.data;
}
