import type { Request, Response } from "express";
import { env } from "../../../config/env.js";
import { AppError } from "../../../errors/AppError.js";
import { getAllowedReturnUrl } from "./redirect-validation.js";
import { SsoService } from "./sso.service.js";
import { BaseController } from "../../../core/BaseController.js";

const ssoService = new SsoService();

function getClientMeta(req: Request): { ipAddress?: string; userAgent?: string } {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress;
  return { ipAddress: ip, userAgent: req.headers["user-agent"] };
}

/**
 * SSO controller. Only mounted when AUTH_SSO_ENABLED is true.
 * GET /status -> public status for login page (no enumeration)
 * GET /:provider -> redirect to IdP
 * GET /:provider/callback -> handle callback, redirect to app with tokens in fragment
 */
export class SsoController extends BaseController {
  /** Public: whether SSO is enabled for an agency. Query: slug= or agencyId=. 404 if not found or SSO off. */
  status = async (req: Request, res: Response): Promise<void> => {
    const query = this.getQuery(req);
    const slug = (query.slug as string)?.trim();
    const agencyId = (query.agencyId as string)?.trim();
    const param = slug || agencyId;
    if (!param) {
      this.fail(res, "VALIDATION_ERROR", "slug or agencyId is required", 400);
      return;
    }
    try {
      const data = await ssoService.getStatus(param);
      this.success(res, data);
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 404) {
        res.status(404).json({ success: false, code: "NOT_FOUND", message: "Not found" });
        return;
      }
      throw err;
    }
  };

  /** Redirect user to identity provider. Query: agencyId, return_url. Backend uses fixed callback URL (registered in IdP). */
  initiate = async (req: Request, res: Response): Promise<void> => {
    const { provider } = this.getParams(req);
    const query = this.getQuery(req);
    const agencyId = (query.agencyId as string)?.trim();
    const returnUrl = (query.return_url as string)?.trim() || undefined;

    if (!agencyId) {
      this.fail(res, "VALIDATION_ERROR", "agencyId is required", 400, { agencyId: "required" });
      return;
    }

    try {
      const { redirectUrl } = await ssoService.initiate(
        provider,
        agencyId,
        returnUrl,
        getClientMeta(req)
      );
      res.redirect(302, redirectUrl);
    } catch (err) {
      this.handleSsoError(req, res, err, undefined);
    }
  };

  /** IdP callback. Query: code, state. Backend uses fixed callback URL (no redirect_uri from client). */
  callback = async (req: Request, res: Response): Promise<void> => {
    const { provider } = this.getParams(req);
    const query = this.getQuery(req);
    const code = (query.code as string)?.trim();
    const state = (query.state as string)?.trim() ?? (req.cookies?.auth_sso_state as string)?.trim();

    if (!code || !state) {
      this.redirectToAppWithError(res, "Missing code or state");
      return;
    }

    try {
      const tokens = await ssoService.callback(
        provider,
        code,
        state,
        getClientMeta(req)
      );
      const rawReturnUrl = this.getReturnUrlFromState(state);
      const target = getAllowedReturnUrl(rawReturnUrl) || env.CORS_ORIGIN.split(",")[0]?.trim() || env.CORS_ORIGIN;
      const hash = new URLSearchParams({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: String(tokens.expiresIn),
      }).toString();
      res.redirect(302, `${target}#${hash}`);
    } catch (err) {
      this.handleSsoError(req, res, err, state);
    }
  };

  /** Parse returnUrl from state payload (for redirect on error). */
  private getReturnUrlFromState(state: string): string | null {
    try {
      const raw = Buffer.from(state, "base64url").toString("utf8");
      const payload = JSON.parse(raw) as { returnUrl?: string };
      return payload.returnUrl && typeof payload.returnUrl === "string" ? payload.returnUrl : null;
    } catch {
      return null;
    }
  }

  private redirectToAppWithError(res: Response, message: string): void {
    const target = env.CORS_ORIGIN;
    const hash = new URLSearchParams({ error: "sso_failed", error_description: message }).toString();
    res.redirect(302, `${target}/login?${hash}`);
  }

  private handleSsoError(
    req: Request,
    res: Response,
    err: unknown,
    state: string | undefined
  ): void {
    if (err instanceof AppError) {
      const code = err.statusCode ?? 400;
      if (req.get("accept")?.includes("application/json")) {
        this.fail(res, err.code ?? "SSO_ERROR", err.message, code);
        return;
      }
      const returnUrl = state ? this.getReturnUrlFromState(state) : null;
      const allowedReturnUrl = returnUrl ? getAllowedReturnUrl(returnUrl) : null;
      const baseUrl = allowedReturnUrl ?? env.CORS_ORIGIN + "/login";
      const params = new URLSearchParams({ error: "sso_failed", error_description: err.message });
      if (allowedReturnUrl) {
        res.redirect(302, `${allowedReturnUrl}#${params.toString()}`);
      } else {
        res.redirect(302, `${baseUrl}?${params.toString()}`);
      }
      return;
    }
    if (req.get("accept")?.includes("application/json")) {
      this.fail(res, "INTERNAL_ERROR", "SSO failed", 500);
      return;
    }
    this.redirectToAppWithError(res, "SSO failed. Please try again.");
  }
}
