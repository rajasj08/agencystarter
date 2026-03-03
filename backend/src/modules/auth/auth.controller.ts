import type { Request, Response } from "express";
import { BaseController } from "../../core/BaseController.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { AuthService } from "./auth.service.js";
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.validation.js";
import type { AuthRequest } from "../../middleware/auth.js";

const authService = new AuthService();

function getClientMeta(req: Request): { ipAddress?: string; userAgent?: string } {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress;
  const userAgent = req.headers["user-agent"];
  return { ipAddress: ip, userAgent };
}

export class AuthController extends BaseController {
  me = async (req: Request, res: Response): Promise<void> => {
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
    this.created(res, data, "Registration successful");
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const parsed = refreshSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const data = await authService.refresh(parsed.data);
    this.success(res, data, RESPONSE_CODES.SUCCESS);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const parsed = refreshSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Validation failed", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    await authService.logout(parsed.data.refreshToken);
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
    await authService.changePassword(userId, parsed.data);
    this.success(res, { message: "Password has been changed" }, RESPONSE_CODES.SUCCESS);
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
    const parsed = refreshSchema.safeParse(this.getBody(req));
    if (!parsed.success) {
      this.fail(res, "VALIDATION_ERROR", "Refresh token required", 400, parsed.error.flatten().fieldErrors as Record<string, unknown>);
      return;
    }
    const userId = (req as AuthRequest).user!.userId;
    const result = await authService.logoutOtherSessions(userId, parsed.data.refreshToken);
    this.success(res, { message: "Other sessions logged out", count: result.count }, RESPONSE_CODES.SUCCESS);
  };
}
