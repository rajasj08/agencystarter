/**
 * Label/error message resolution. Replace with i18n (e.g. auth.email -> t("auth.email")) when adding translation.
 */
const LABELS: Record<string, string> = {
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm Password",
  "auth.name": "Name",
  "auth.emailRequired": "Email is required",
  "auth.emailInvalid": "Invalid email address",
  "auth.passwordRequired": "Password is required",
  "auth.passwordMin": "Password must be at least 8 characters",
  "auth.confirmPasswordRequired": "Please confirm your password",
  "auth.passwordMismatch": "Passwords do not match",
  "auth.emailExists": "An account with this email already exists",
  "auth.invalidCredentials": "Invalid email or password",
  "auth.emailNotVerified": "Please verify your email first",
  "auth.tokenExpired": "Link expired",
  "auth.tokenInvalid": "Invalid link",
  "agency.name": "Agency name",
  "agency.slug": "Slug (URL-friendly)",
  "agency.nameRequired": "Agency name is required",
  "agency.slugRequired": "Slug is required",
  "agency.slugInvalid": "Slug must be lowercase letters, numbers, and hyphens only",
};

export function getLabel(key: string): string {
  return LABELS[key] ?? key;
}
