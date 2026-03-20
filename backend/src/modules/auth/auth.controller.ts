import type { Request, Response } from "express";
import crypto from "node:crypto";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { AuthService } from "./auth.service.js";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { resolveRoleId } from "../../middleware/rbac.js";
import { getPermissionKeysForRole } from "../../services/RolePermissionCache.js";
import { PERMISSIONS } from "../../constants/permissions.js";
import { audit } from "../../lib/audit.js";
import { REFRESH_TOKEN_EXPIRY_MS } from "../../constants/auth.js";
import { env } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";

const authService = new AuthService();
const REFRESH_COOKIE_NAME = "refresh_token";
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

function setRefreshCookie(res: Response, refreshToken: string): void {
  if (!env.SECURE_SESSION_COOKIES_ENABLED) return;
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: "/",
  });
}

function setCsrfCookie(res: Response): string {
  if (!env.SECURE_SESSION_COOKIES_ENABLED) return "";
  const csrfToken = crypto.randomBytes(24).toString("base64url");
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: "/",
  });
  return csrfToken;
}

function clearRefreshCookie(res: Response): void {
  if (!env.SECURE_SESSION_COOKIES_ENABLED) return;
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
  res.clearCookie(CSRF_COOKIE_NAME, { path: "/" });
}

function requireCsrf(req: Request): void {
  if (!env.SECURE_SESSION_COOKIES_ENABLED) return;
  const cookieToken = (req.cookies?.[CSRF_COOKIE_NAME] as string | undefined)?.trim();
  const headerToken = (req.headers[CSRF_HEADER_NAME] as string | undefined)?.trim();
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Invalid CSRF token", 403);
  }
}

function getClientMeta(req: Request): { ipAddress?: string; userAgent?: string } {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress;
  const userAgent = req.headers["user-agent"];
  return { ipAddress: ip, userAgent };
}

export class AuthController extends BaseController {
  me = async (req: Request, res: Response): Promise<void> => {
    if (req.cookies?.[REFRESH_COOKIE_NAME] && !req.cookies?.[CSRF_COOKIE_NAME]) {
      setCsrfCookie(res);
    }
    const authUser = (req as AuthRequest).user!;
    const data = await authService.getMe(authUser.userId, {
      impersonation: authUser.impersonation,
      agencyId: authUser.agencyId,
    });
    this.success(res, data, RESPONSE_CODES.FETCHED);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const data = await authService.login(parsed.data, getClientMeta(req));
    if ("refreshToken" in data && typeof data.refreshToken === "string" && data.refreshToken.length > 0) {
      setRefreshCookie(res, data.refreshToken);
      setCsrfCookie(res);
    }
    this.success(res, data, RESPONSE_CODES.LOGIN_SUCCESS, "Login successful");
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const data = await authService.register(parsed.data);
    if ("code" in data && data.code === RESPONSE_CODES.EMAIL_VERIFICATION_REQUIRED) {
      this.success(res, { user: data.user, message: data.message }, data.code, data.message);
      return;
    }
    if ("refreshToken" in data && typeof data.refreshToken === "string" && data.refreshToken.length > 0) {
      setRefreshCookie(res, data.refreshToken);
      setCsrfCookie(res);
    }
    this.created(res, data, "Registration successful");
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined)?.trim() ||
      ((this.getBody(req) as { refreshToken?: string } | undefined)?.refreshToken?.trim() ?? "");
    if (!refreshToken || !refreshToken.trim()) {
      this.fail(res, "VALIDATION_ERROR", "Refresh token required", 400);
      return;
    }
    if (req.cookies?.[REFRESH_COOKIE_NAME]) requireCsrf(req);
    const data = await authService.refresh({ refreshToken });
    setCsrfCookie(res);
    this.success(res, data, RESPONSE_CODES.SUCCESS);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined)?.trim() ||
      ((this.getBody(req) as { refreshToken?: string } | undefined)?.refreshToken?.trim() ?? "");
    if (req.cookies?.[REFRESH_COOKIE_NAME] && refreshToken) {
      requireCsrf(req);
    }
    if (refreshToken && refreshToken.trim()) {
      await authService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    this.success(res, { message: "Logged out" }, RESPONSE_CODES.SUCCESS);
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const parsed = verifyEmailSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const data = await authService.verifyEmail(parsed.data);
    this.success(res, data, RESPONSE_CODES.SUCCESS, "Email verified");
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = forgotPasswordSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    await authService.forgotPassword(parsed.data);
    this.success(res, { message: "If an account exists, you will receive a password reset link" }, RESPONSE_CODES.PASSWORD_RESET_SENT);
  };

  validateResetToken = async (req: Request, res: Response): Promise<void> => {
    const parsed = validateResetTokenSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const result = await authService.validateResetToken(parsed.data.token);
    this.success(res, result, RESPONSE_CODES.SUCCESS);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = resetPasswordSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    await authService.resetPassword(parsed.data);
    this.success(res, { message: "Password has been reset" }, RESPONSE_CODES.SUCCESS);
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const parsed = changePasswordSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const userId = (req as AuthRequest).user!.userId;
    const result = await authService.changePassword(userId, parsed.data);
    clearRefreshCookie(res);
    this.success(res, { message: result.message, user: result.user }, RESPONSE_CODES.UPDATED, "Password changed");
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const parsed = updateProfileSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const userId = (req as AuthRequest).user!.userId;
    const user = await authService.updateProfile(userId, parsed.data);
    this.success(res, user, RESPONSE_CODES.UPDATED, "Profile updated");
  };

  getSessions = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as AuthRequest).user!.userId;
    const sessions = await authService.getSessions(userId);
    this.success(res, { sessions }, RESPONSE_CODES.FETCHED);
  };

  logoutOtherSessions = async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined)?.trim() ||
      ((this.getBody(req) as { refreshToken?: string } | undefined)?.refreshToken?.trim() ?? "");
    if (!refreshToken || !refreshToken.trim()) {
      this.fail(res, "VALIDATION_ERROR", "Refresh token required", 400);
      return;
    }
    if (req.cookies?.[REFRESH_COOKIE_NAME]) requireCsrf(req);
    const userId = (req as AuthRequest).user!.userId;
    const result = await authService.logoutOtherSessions(userId, refreshToken);
    this.success(res, { message: "Other sessions logged out", count: result.count }, RESPONSE_CODES.SUCCESS);
  };

  /** List active sessions for the tenant (agency). Requires USER_LIST. */
  getSessionsForTenant = async (req: Request, res: Response): Promise<void> => {
    const agencyId = (req as AuthRequest).user!.agencyId!;
    const sessions = await authService.getSessionsForTenant(agencyId);
    this.success(res, { sessions }, RESPONSE_CODES.FETCHED);
  };

  /** Revoke a session by id. Allowed: own session, or tenant admin (USER_LIST) for session in same agency, or superadmin. */
  revokeSession = async (req: Request, res: Response): Promise<void> => {
    const { id: sessionId } = this.getParams(req);
    const authReq = req as AuthRequest;
    let hasTenantAdmin = authReq.user!.isSuperAdmin === true;
    if (!hasTenantAdmin && authReq.user!.isApiKey && authReq.user!.apiKeyPermissions) {
      hasTenantAdmin =
        authReq.user!.apiKeyPermissions.has(PERMISSIONS.USER_LIST) ||
        authReq.user!.apiKeyPermissions.has(PERMISSIONS.ADMIN_ALL);
    } else if (!hasTenantAdmin) {
      const roleId = await resolveRoleId(authReq);
      if (roleId) {
        const keys = await getPermissionKeysForRole(roleId);
        hasTenantAdmin = keys.has(PERMISSIONS.USER_LIST) || keys.has(PERMISSIONS.ADMIN_ALL);
      }
    }
    const { sessionId: id, targetUserId } = await authService.revokeSessionById(
      sessionId,
      authReq.user!,
      hasTenantAdmin
    );
    await audit(authReq, {
      action: "session.revoked",
      resource: "session",
      resourceId: id,
      details: { targetUserId },
    });
    this.success(res, { id }, RESPONSE_CODES.UPDATED, "Session revoked");
  };
}
