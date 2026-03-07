import {
  discovery,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  ClientSecretPost,
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomNonce,
  skipSubjectCheck,
  allowInsecureRequests,
  type Configuration,
} from "openid-client";
import type { OidcConfig } from "../types.js";

/**
 * OIDC provider using openid-client v6 API (discovery, Configuration, buildAuthorizationUrl, authorizationCodeGrant, fetchUserInfo).
 */

export class OidcProvider {
  private configCache = new Map<string, Configuration>();

  private cacheKey(config: OidcConfig): string {
    return `${config.issuer}|${config.clientId}`;
  }

  private async getConfig(config: OidcConfig): Promise<Configuration> {
    const key = this.cacheKey(config);
    let cached = this.configCache.get(key);
    if (cached) return cached;
    const issuerUrl = config.issuer.startsWith("http") ? config.issuer : `https://${config.issuer}`;
    const server = new URL(issuerUrl.endsWith("/") ? issuerUrl : `${issuerUrl}/`);
    const metadata: Partial<{ redirect_uris: string[]; scope: string; client_secret: string }> = {
      scope: config.scope ?? "openid email profile",
      client_secret: config.clientSecret,
    };
    const execute: Array<(c: Configuration) => void> = [];
    if (server.protocol === "http:") {
      execute.push(allowInsecureRequests);
    }
    const options = { execute };
    cached = await discovery(
      server,
      config.clientId,
      metadata,
      ClientSecretPost(config.clientSecret),
      options
    );
    this.configCache.set(key, cached);
    return cached;
  }

  /**
   * Build authorization URL and return it plus the PKCE code_verifier to store in state.
   */
  async getAuthorizationUrl(
    config: OidcConfig,
    redirectUri: string,
    state: string,
    opts?: { nonce?: string }
  ): Promise<{ url: string; codeVerifier: string }> {
    const clientConfig = await this.getConfig(config);
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const nonce = opts?.nonce ?? randomNonce();
    const params: Record<string, string> = {
      redirect_uri: redirectUri,
      scope: config.scope ?? "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      response_mode: "form_post",
    };
    const url = buildAuthorizationUrl(clientConfig, params);
    return { url: url.toString(), codeVerifier };
  }

  /**
   * Exchange authorization code for tokens and return userinfo.
   */
  async callback(
    config: OidcConfig,
    redirectUri: string,
    params: { code: string; state: string; codeVerifier: string; nonce?: string }
  ): Promise<{ tokenSet: { access_token?: string; claims?: () => { iss?: string; aud?: string | string[] } }; userinfo: { email?: string; email_verified?: boolean; sub?: string; given_name?: string; family_name?: string; name?: string } }> {
    const clientConfig = await this.getConfig(config);
    const callbackUrl = new URL(redirectUri);
    // Standard auth code flow: params in query (form_post sends body; we simulate the URL the IdP would have redirected to)
    callbackUrl.searchParams.set("code", params.code);
    callbackUrl.searchParams.set("state", params.state);
    const checks: { expectedState: string; pkceCodeVerifier: string; expectedNonce?: string } = {
      expectedState: params.state,
      pkceCodeVerifier: params.codeVerifier,
    };
    if (params.nonce) checks.expectedNonce = params.nonce;
    const tokenSet = await authorizationCodeGrant(clientConfig, callbackUrl, checks);
    const accessToken = tokenSet.access_token;
    if (!accessToken) {
      throw new Error("No access_token in token response");
    }
    const userinfo = await fetchUserInfo(clientConfig, accessToken, skipSubjectCheck);
    const claims = "claims" in tokenSet && typeof (tokenSet as { claims?: () => unknown }).claims === "function"
      ? (tokenSet as { claims: () => { iss?: string; aud?: string | string[] } }).claims()
      : undefined;
    return {
      tokenSet: { ...tokenSet, claims: claims ? () => claims : undefined },
      userinfo: userinfo as { email?: string; email_verified?: boolean; sub?: string; given_name?: string; family_name?: string; name?: string },
    };
  }
}

export const oidcProvider = new OidcProvider();
