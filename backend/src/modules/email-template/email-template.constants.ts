import type { EmailTemplateKey } from "../email/types/email-template.js";

/** Template keys that can have DB overrides (editable by superadmin/agency). */
export const EDITABLE_TEMPLATE_KEYS: EmailTemplateKey[] = [
  "verification",
  "password-reset",
  "password-reset-admin",
  "invitation",
];

/** Variables available per template (for variables API and preview). organizationName is set when sending (agency or app name). */
export const TEMPLATE_VARIABLES: Record<string, string[]> = {
  verification: ["organizationName", "userName", "verificationLink"],
  "password-reset": ["organizationName", "userName", "resetLink", "expiryMinutes"],
  "password-reset-admin": ["organizationName", "userName", "resetLink", "expiryMinutes"],
  invitation: ["organizationName", "userName", "setPasswordLink", "expiryDisplay"],
  test: ["organizationName"],
};

/** Base sample values (organizationName, userName, etc.). Link URLs are built with app base URL at runtime. */
export const SAMPLE_VARIABLES_BASE: Record<string, string> = {
  organizationName: "Acme Corp",
  userName: "John Doe",
  expiryMinutes: "60",
  expiryDisplay: "7 days",
};

/** Paths used for sample links (must match frontend routes). */
export const SAMPLE_LINK_PATHS = {
  verificationLink: "/verify-email?token=abc123",
  resetLink: "/reset-password?token=xyz789",
  setPasswordLink: "/change-password?token=invite123",
} as const;

/**
 * Build sample variables with links pointing to the app's frontend (from baseUrl).
 * Use for test emails and default content so links use your app URL, not example.com.
 */
export function getSampleVariables(baseUrl: string): Record<string, string> {
  const base = baseUrl.replace(/\/$/, "");
  return {
    ...SAMPLE_VARIABLES_BASE,
    verificationLink: `${base}${SAMPLE_LINK_PATHS.verificationLink}`,
    resetLink: `${base}${SAMPLE_LINK_PATHS.resetLink}`,
    setPasswordLink: `${base}${SAMPLE_LINK_PATHS.setPasswordLink}`,
  };
}

/** @deprecated Use getSampleVariables(env.CORS_ORIGIN) for test/default content. Fallback for callers that don't pass baseUrl. */
export const SAMPLE_VARIABLES: Record<string, string> = {
  ...SAMPLE_VARIABLES_BASE,
  verificationLink: "https://example.com/verify-email?token=abc123",
  resetLink: "https://example.com/reset-password?token=xyz789",
  setPasswordLink: "https://example.com/change-password?token=invite123",
};
