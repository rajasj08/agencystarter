/**
 * Shared User/Auth user shape. Keep in sync with backend auth responses and frontend AuthUser.
 */

export interface AgencyRef {
  id: string;
  name: string;
  slug: string;
  onboardingCompleted: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  agencyId: string | null;
  agency: AgencyRef | null;
}
