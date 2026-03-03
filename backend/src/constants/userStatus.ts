/**
 * Single source for user status. Never use booleans for user state.
 */

export const USER_STATUS = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  SUSPENDED: "SUSPENDED",
  INVITED: "INVITED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
