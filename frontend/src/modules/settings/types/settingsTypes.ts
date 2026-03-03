/**
 * Agency settings – align with backend. All fields optional for partial update.
 */
export interface AgencySettings {
  // Agency identity
  name?: string | null;
  slug?: string | null;
  logo?: string | null;
  websiteUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  // Primary contact
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  // Localization (mandatory section)
  timezone?: string | null;
  defaultLanguage?: string | null;
  dateFormat?: string | null;
  currency?: string | null;
  // User management
  allowSelfRegistration?: boolean;
  defaultUserRole?: string | null;
  requireAdminApproval?: boolean;
  allowUserInvitations?: boolean;
  // SMTP
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  // Email features
  enableEmails?: boolean;
  enableVerificationEmails?: boolean;
  enableResetEmails?: boolean;
  theme?: "light" | "dark" | "system" | null;
}

export type SettingsUpdateInput = Partial<AgencySettings>;
