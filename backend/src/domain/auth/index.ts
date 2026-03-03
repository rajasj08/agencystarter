/**
 * Auth domain: entities and value objects. Modules (auth) depend on these.
 */

/** JWT payload (identity + tenant + role). */
export interface JwtPayload {
  userId: string;
  agencyId: string | null;
  role: string;
}

/** Session identity (for refresh and logout). */
export interface SessionIdentity {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}
