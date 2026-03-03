/**
 * Typed config slices. Use for dependency injection or typed access.
 */

export interface JwtConfig {
  secret: string;
}

export interface AuthConfig {
  requireEmailVerification: boolean;
  jwt: JwtConfig;
}

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  /** True if SMTP is configured and emails can be sent. */
  enabled: boolean;
}

export interface DbConfig {
  url: string;
}

export interface ApiConfig {
  prefix: string;
}
