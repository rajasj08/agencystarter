/**
 * Shared Agency shape. Keep in sync with backend Prisma Agency and API responses.
 */

export interface Agency {
  id: string;
  name: string;
  slug: string;
  onboardingCompleted: boolean;
  settings?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}
