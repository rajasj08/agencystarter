/**
 * Map API error codes to translation keys (or display messages until i18n).
 * Backend returns codes like EMAIL_ALREADY_EXISTS; map to auth.emailExists.
 */
export const ERROR_MAP: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: "auth.emailExists",
  INVALID_CREDENTIALS: "auth.invalidCredentials",
  EMAIL_NOT_VERIFIED: "auth.emailNotVerified",
  TOKEN_EXPIRED: "auth.tokenExpired",
  TOKEN_INVALID: "auth.tokenInvalid",
};

export function getErrorMessage(code: string, fallback: string): string {
  return ERROR_MAP[code] ?? fallback;
}
