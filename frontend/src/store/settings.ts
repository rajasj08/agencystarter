"use client";

import { create } from "zustand";
import type { AgencySettings } from "@/services/settings";
import { getSettings as fetchSettings, updateSettings as updateSettingsApi } from "@/services/settings";

interface SettingsState {
  settings: AgencySettings | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  update: (payload: Partial<AgencySettings>) => Promise<void>;
  reset: () => void;
}

const initialState = {
  settings: null,
  loading: false,
  error: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialState,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchSettings();
      set({ settings: data, loading: false });
    } catch (err) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to load settings"
        : "Failed to load settings";
      set({ error: message, loading: false });
    }
  },

  update: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await updateSettingsApi(payload);
      set({ settings: data, loading: false });
    } catch (err) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to update settings"
        : "Failed to update settings";
      set({ error: message, loading: false });
      throw err;
    }
  },

  reset: () => set(initialState),
}));
