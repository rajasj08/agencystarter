/**
 * Feature flags. Prefer this over raw env for app-level toggles.
 * Backend only; frontend can request a /config or /features endpoint if needed.
 */

import { env } from "./env.js";

export const features = {
  EMAIL_VERIFICATION: env.REQUIRE_EMAIL_VERIFICATION,
} as const;

export type FeatureFlags = typeof features;
