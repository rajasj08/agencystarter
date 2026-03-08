import { get as getSystemConfig } from "../../services/SystemConfigCache.js";

export const AuthFeature = {
  name: "auth",
  description: "Authentication system (email/password, verification, sessions)",
  get enabled(): boolean {
    return true;
  },
};

export const EmailVerificationFeature = {
  name: "email_verification",
  description: "Require email verification before login",
  get enabled(): boolean {
    return getSystemConfig().emailVerificationRequired;
  },
};
