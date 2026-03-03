import { AuthFeature, EmailVerificationFeature } from "./auth.js";
import { BillingFeature } from "./billing.js";
import { NotificationsFeature } from "./notifications.js";

export interface FeatureDefinition {
  name: string;
  description: string;
  enabled: boolean;
}

const all: FeatureDefinition[] = [
  { name: AuthFeature.name, description: AuthFeature.description, enabled: AuthFeature.enabled },
  { name: EmailVerificationFeature.name, description: EmailVerificationFeature.description, enabled: EmailVerificationFeature.enabled },
  { name: BillingFeature.name, description: BillingFeature.description, enabled: BillingFeature.enabled },
  { name: NotificationsFeature.name, description: NotificationsFeature.description, enabled: NotificationsFeature.enabled },
];

export function getFeatureRegistry(): FeatureDefinition[] {
  return all;
}
