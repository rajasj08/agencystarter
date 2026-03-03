/**
 * Users module types. Keep entity shapes internal; expose DTOs only.
 */

import type { UserStatus } from "@prisma/client";

export interface UserAgencyRef {
  id: string;
  name: string;
  slug: string;
  onboardingCompleted: boolean;
}
