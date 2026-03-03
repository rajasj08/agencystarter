/**
 * User domain: entities and value objects. Modules (e.g. users, auth) depend on these.
 * Business rules live here; API and persistence live in modules.
 */

export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "DISABLED" | "SUSPENDED" | "INVITED";

/** Domain entity: user aggregate (identity + role + tenant). */
export interface UserEntity {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  role: string;
  agencyId: string | null;
}

/** Value object: normalized email (lowercase). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
