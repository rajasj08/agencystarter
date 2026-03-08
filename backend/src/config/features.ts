/**
 * Feature flags. Prefer this over raw env for app-level toggles.
 * Backend only; frontend can request a /config or /features endpoint if needed.
 * Email verification is controlled by system settings (SystemConfigCache), not env.
 */

export const features = {} as const;

export type FeatureFlags = typeof features;
