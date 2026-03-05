/**
 * SSO module types. Agency.ssoConfig JSON shape for OIDC.
 */
export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
  /** Optional: restrict sign-in to these email domains (e.g. ["company.com"]). */
  allowedEmailDomains?: string[];
}

export interface SsoStatePayload {
  agencyId: string;
  returnUrl?: string;
  nonce: string;
}
