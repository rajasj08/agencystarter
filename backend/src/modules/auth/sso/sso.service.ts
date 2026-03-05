import crypto from "node:crypto";
import { authRepository as authRepo, agencyRepository as agencyRepo, roleRepository as roleRepo, auditLogRepository } from "../../../lib/data-access.js";
import { AuthService } from "../auth.service.js";
import { AppError } from "../../../errors/AppError.js";
import { ERROR_CODES } from "../../../constants/errorCodes.js";
import { ROLES } from "../../../constants/roles.js";
import { USER_STATUS } from "../../../constants/userStatus.js";
import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";
import { oidcProvider } from "./providers/oidc.provider.js";
import type { OidcConfig, SsoStatePayload } from "./types.js";

/** Fixed backend callback URL; registered in IdP. Frontend never talks to IdP. */
function getSsoCallbackUrl(): string {
  const base = env.API_PUBLIC_BASE_URL.replace(/\/$/, "");
  const prefix = env.API_PREFIX.replace(/^\//, "").replace(/\/$/, "");
  return `${base}/${prefix}/auth/sso/oidc/callback`;
}

/** Normalize email: trim, lowercase, NFKC (prevents Unicode lookalikes and case/whitespace issues). */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase().normalize("NFKC");
}

/** Recommended OAuth state TTL: 3–5 minutes. */
const STATE_TTL_MS = 5 * 60 * 1000;
const stateStore = new Map<string, { payload: SsoStatePayload; expires: number }>();

function parseState(state: string): SsoStatePayload {
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as SsoStatePayload;
    if (!payload.agencyId || !payload.nonce) throw new Error("Invalid state");
    return payload;
  } catch {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Invalid or expired SSO state", 400);
  }
}

function encodeState(payload: SsoStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/**
 * Enforce agency–provider consistency. Fail early at initiate and callback.
 * Use generic "Not found" when agency missing to avoid enumeration.
 */
function getOidcConfigFromAgency(
  agency: { ssoConfig: unknown; ssoEnabled: boolean; ssoProvider: string | null } | null,
  provider: string
): OidcConfig {
  if (!agency) {
    throw new AppError(ERROR_CODES.USER_NOT_FOUND, "Not found", 404);
  }
  if (!agency.ssoEnabled) {
    logger.warn("SSO disabled attempt", { agencyId: agency.id, provider });
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "SSO is not enabled for this agency", 403);
  }
  if (agency.ssoProvider !== provider) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Agency SSO provider does not match", 403);
  }
  const config = agency.ssoConfig as OidcConfig | null | undefined;
  if (!config || typeof config.issuer !== "string" || typeof config.clientId !== "string" || typeof config.clientSecret !== "string") {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Agency SSO is not configured", 400);
  }
  return config;
}

export class SsoService {
  private authService = new AuthService();

  /**
   * Public status for login page: whether SSO is enabled for an agency.
   * Returns 404 when agency not found or SSO globally disabled (no enumeration).
   */
  async getStatus(slugOrAgencyId: string): Promise<{ ssoEnabled: boolean; agencyId?: string; provider?: string; ssoEnforced?: boolean }> {
    const bySlug = await agencyRepo.findBySlug(slugOrAgencyId);
    const agency = bySlug ?? (slugOrAgencyId.length >= 10 ? await agencyRepo.findById(slugOrAgencyId) : null);
    if (!agency) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "Not found", 404);
    }
    if (!agency.ssoEnabled) {
      return { ssoEnabled: false, agencyId: agency.id };
    }
    return {
      ssoEnabled: true,
      agencyId: agency.id,
      provider: agency.ssoProvider ?? "oidc",
      ssoEnforced: agency.ssoEnforced ?? false,
    };
  }

  /**
   * Start SSO flow: resolve agency, build state, return redirect URL to IdP.
   * Uses fixed backend callback URL (registered in IdP). Frontend only passes agencyId and return_url.
   */
  async initiate(
    provider: string,
    agencyId: string,
    returnUrl: string | undefined,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<{ redirectUrl: string }> {
    if (provider !== "oidc") {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Unsupported SSO provider", 400);
    }
    const redirectUri = getSsoCallbackUrl();
    const agency = await agencyRepo.findById(agencyId);
    const config = getOidcConfigFromAgency(agency, provider);
    const nonce = crypto.randomBytes(16).toString("hex");
    const statePayload: SsoStatePayload = { agencyId, returnUrl, nonce };
    const state = encodeState(statePayload);
    stateStore.set(state, { payload: statePayload, expires: Date.now() + STATE_TTL_MS });
    const authUrl = await oidcProvider.getAuthorizationUrl(config, redirectUri, state, { nonce });
    return { redirectUrl: authUrl };
  }

  /**
   * Handle IdP callback: validate state, exchange code, find or create user, issue tokens.
   * Uses fixed backend callback URL (same as initiate).
   */
  async callback(
    provider: string,
    code: string,
    state: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    if (provider !== "oidc") {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Unsupported SSO provider", 400);
    }
    const redirectUri = getSsoCallbackUrl();
    // Single-use: atomic lookup + delete so replay gets "not found"
    const stored = stateStore.get(state);
    stateStore.delete(state);
    if (!stored || stored.expires < Date.now()) {
      logger.warn("SSO callback: invalid or expired state", { provider, ipAddress: meta?.ipAddress });
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Invalid or expired SSO state", 400);
    }
    const { agencyId } = stored.payload;

    const agency = await agencyRepo.findById(agencyId);
    const config = getOidcConfigFromAgency(agency, provider);

    const { tokenSet, userinfo } = await oidcProvider.callback(config, redirectUri, { code, state });

    const rawEmail = userinfo.email as string | undefined;
    if (rawEmail === undefined || String(rawEmail).trim() === "") {
      logger.warn("SSO callback: missing email", { agencyId, provider, ipAddress: meta?.ipAddress });
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "IdP did not return an email", 400);
    }
    const email = normalizeEmail(String(rawEmail));

    const emailVerified = userinfo.email_verified === true || userinfo.email_verified === "true";
    if (!emailVerified) {
      logger.warn("SSO callback: email not verified", { agencyId, provider, ipAddress: meta?.ipAddress });
      throw new AppError(ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED, "Email must be verified by your identity provider", 403);
    }

    const sub = userinfo.sub as string | undefined;
    if (sub === undefined || String(sub).trim() === "") {
      logger.warn("SSO callback: missing sub", { agencyId, provider, ipAddress: meta?.ipAddress });
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "IdP did not return a subject", 400);
    }
    const subStr = String(sub).trim();

    const tokenClaims = (tokenSet as { claims?: () => { iss?: string; aud?: string | string[] } }).claims?.();
    if (tokenClaims) {
      if (config.issuer && tokenClaims.iss) {
        const tokenIssuer = String(tokenClaims.iss).replace(/\/$/, "");
        const expectedIssuer = config.issuer.replace(/\/$/, "");
        if (tokenIssuer !== expectedIssuer) {
          logger.warn("SSO callback: issuer mismatch", { agencyId, provider, expectedIssuer, tokenIssuer });
          throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Issuer mismatch", 400);
        }
      }
      if (config.clientId && tokenClaims.aud !== undefined) {
        const aud = tokenClaims.aud;
        const expected = config.clientId;
        const match = Array.isArray(aud) ? aud.includes(expected) : aud === expected;
        if (!match) {
          logger.warn("SSO callback: audience mismatch", { agencyId, provider });
          throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Audience mismatch", 400);
        }
      }
    }

    // Enforcement order: 1) normalized email 2) email_verified 3) allowedEmailDomains 4) then match user (avoids domain bypass via case/whitespace)
    const allowedDomains = config.allowedEmailDomains;
    if (Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      const domain = email.split("@")[1];
      if (!domain || !allowedDomains.some((d) => d.trim().toLowerCase() === domain.toLowerCase())) {
        logger.warn("SSO callback: email domain not allowed", { agencyId, provider, domain, allowedDomains: allowedDomains.length });
        throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Your email domain is not allowed for this organization", 403);
      }
    }

    const firstName = (userinfo.given_name as string) ?? null;
    const lastName = (userinfo.family_name as string) ?? null;
    const displayName = (userinfo.name as string) ?? ([firstName, lastName].filter(Boolean).join(" ") || null);

    let user = await authRepo.findByProviderId("oidc", subStr);
    if (user) {
      if (user.agencyId !== agencyId) {
        throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid login credentials", 401);
      }
    } else {
      user = await authRepo.findByEmailAndAgency(email, agencyId);
      if (user) {
        if (user.authProvider === "LOCAL") {
          throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, "An account with this email already exists. Sign in with password.", 409);
        }
      } else if (env.AUTH_SSO_AUTO_PROVISION) {
        const systemUserRole = await roleRepo.findSystemRoleByName(ROLES.USER);
        if (!systemUserRole) {
          throw new AppError(ERROR_CODES.INTERNAL_ERROR, "System role USER not found", 500);
        }
        user = await authRepo.createUser({
          email,
          passwordHash: null,
          displayName,
          firstName,
          lastName,
          roleId: systemUserRole.id,
          status: USER_STATUS.ACTIVE,
          agencyId,
          authProvider: "OIDC",
          providerId: subStr,
        });
        await auditLogRepository.create({
          userId: user.id,
          agencyId: user.agencyId ?? null,
          action: "user.auto_provision",
          resource: "user",
          resourceId: user.id,
          details: { provider, agencyId, email: user.email },
          ipAddress: meta?.ipAddress ?? null,
          userAgent: meta?.userAgent ?? null,
        });
      } else {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, "No account found. Contact your administrator to be invited.", 403);
      }
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.AUTH_USER_DISABLED, "Account is disabled", 403);
    }

    const roleName = user.roleRef?.name ?? (user as { role?: string }).role;
    if (roleName === ROLES.SUPER_ADMIN) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid login credentials", 401);
    }

    // Provider–agency binding: if user has providerId (OIDC), agency must be configured for same provider
    if (user.authProvider === "OIDC" && user.providerId && agency.ssoProvider !== provider) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "This account is not linked to this organization's SSO", 403);
    }

    const { auditLogin } = await import("../../../lib/audit.js");
    await auditLogin({
      userId: user.id,
      agencyId: user.agencyId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.authService.issueTokens(user, meta);
  }
}
