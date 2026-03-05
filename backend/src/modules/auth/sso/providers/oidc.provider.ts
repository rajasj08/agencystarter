import { Issuer, Client, type TokenSet, type UserinfoResponse } from "openid-client";
import type { OidcConfig } from "../types.js";

/**
 * OIDC provider: discovery, auth URL, token exchange, userinfo.
 * Uses openid-client for standards-compliant OIDC.
 */
export class OidcProvider {
  private clientCache = new Map<string, Client>();

  private cacheKey(config: OidcConfig): string {
    return `${config.issuer}|${config.clientId}`;
  }

  private async getClient(config: OidcConfig): Promise<Client> {
    const key = this.cacheKey(config);
    let client = this.clientCache.get(key);
    if (client) return client;
    const issuer = await Issuer.discover(config.issuer);
    client = new issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [], // Set per-request in authorizationUrl/callback
      response_types: ["code"],
      scope: config.scope ?? "openid email profile",
    });
    this.clientCache.set(key, client);
    return client;
  }

  /**
   * Build authorization URL for the IdP. redirectUri must match what you pass to callback.
   */
  async getAuthorizationUrl(
    config: OidcConfig,
    redirectUri: string,
    state: string,
    opts?: { nonce?: string }
  ): Promise<string> {
    const client = await this.getClient(config);
    return client.authorizationUrl({
      redirect_uri: redirectUri,
      scope: config.scope ?? "openid email profile",
      state,
      nonce: opts?.nonce,
    });
  }

  /**
   * Exchange authorization code for tokens and return userinfo.
   */
  async callback(
    config: OidcConfig,
    redirectUri: string,
    params: { code: string; state: string }
  ): Promise<{ tokenSet: TokenSet; userinfo: UserinfoResponse }> {
    const client = await this.getClient(config);
    const tokenSet = await client.callback(
      redirectUri,
      { code: params.code, state: params.state },
      { state: params.state }
    );
    const userinfo = await client.userinfo(tokenSet);
    return { tokenSet, userinfo };
  }
}

export const oidcProvider = new OidcProvider();
