import { api, type ApiSuccess } from "./api";

/** Public agency details for the agency login page (no auth required). */
export interface AgencyPublicLogin {
  id: string;
  name: string;
  logoUrl: string | null;
  ssoEnabled: boolean;
  ssoEnforced: boolean;
  ssoProvider: string | null;
}

/**
 * Fetch agency by slug for the login page. Public endpoint.
 * @throws on 404 (agency not found or not active) or network error
 */
export async function getAgencyBySlug(agencySlug: string): Promise<AgencyPublicLogin> {
  const slug = agencySlug.trim().toLowerCase();
  if (!slug) {
    throw new Error("Agency slug is required");
  }
  const { data } = await api.get<ApiSuccess<AgencyPublicLogin>>(`/agencies/slug/${encodeURIComponent(slug)}`);
  return data.data;
}
