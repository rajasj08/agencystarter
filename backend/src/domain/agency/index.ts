/**
 * Agency domain: entities and value objects. Modules (agency, settings) depend on these.
 */

/** Domain entity: agency aggregate (tenant). */
export interface AgencyEntity {
  id: string;
  name: string;
  slug: string;
  onboardingCompleted: boolean;
}

/** Value object: slug must be URL-safe and unique per tenant. */
export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
