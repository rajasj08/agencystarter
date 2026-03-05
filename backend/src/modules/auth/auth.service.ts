import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository as authRepo, agencyRepository, roleRepository as roleRepo, getPrismaForInternalUse } from "../../lib/data-access.js";
import { BaseService } from "../../core/BaseService.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../constants/errorCodes.js";
import { RESPONSE_CODES } from "../../constants/responseCodes.js";
import { ROLES } from "../../constants/roles.js";
import { USER_STATUS } from "../../constants/userStatus.js";
import type { UserStatus } from "@prisma/client";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY_MS } from "../../constants/auth.js";
import { env } from "../../config/env.js";
import {
  sendVerificationEmail as sendVerificationEmailMail,
  sendPasswordResetEmail as sendPasswordResetEmailMail,
} from "../../lib/mail.js";
import type {
  LoginInput,
  RegisterInput,
  RefreshInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "./auth.validation.js";
import { getPermissionsForUser, type RequestPermissionCache } from "./permission-resolver.js";
import { PERMISSION_VERSION } from "../../constants/permissionVersion.js";

export interface JwtPayload {
  userId: string;
  agencyId: string | null;
  role: string;
  /** Role id for permission lookup (cache/DB). Omitted for SUPER_ADMIN in impersonation. */
  roleId?: string | null;
  /** Snapshot of role.permissionsVersion at login; used to invalidate sessions when role permissions change. */
  permissionSnapshotVersion?: number;
  /** True when role is SUPER_ADMIN. Enables fast checks without string comparison. */
  isSuperAdmin?: boolean;
  /** True when a SUPER_ADMIN is acting in the context of another agency (impersonation). */
  impersonation?: boolean;
  /** Token scope: platform = superadmin only, tenant = agency-scoped (incl. impersonation). Prevents privilege bleed. */
  scope?: "platform" | "tenant";
}

export class AuthService extends BaseService {
  private hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private createAccessToken(payload: JwtPayload): string {
    const isSuperAdmin = payload.role === ROLES.SUPER_ADMIN;
    const scope: "platform" | "tenant" =
      isSuperAdmin && !payload.impersonation ? "platform" : "tenant";
    const toSign: JwtPayload = {
      ...payload,
      roleId: payload.roleId ?? undefined,
      permissionSnapshotVersion: payload.permissionSnapshotVersion ?? undefined,
      isSuperAdmin,
      scope,
    };
    return jwt.sign(toSign, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  private roleNameAndId(user: { roleRef?: { id: string; name: string } | null; role?: string | null; roleId?: string | null }): { role: string; roleId: string | null } {
    const role = user.roleRef?.name ?? user.role ?? "USER";
    const roleId = user.roleRef?.id ?? user.roleId ?? null;
    return { role, roleId };
  }

  private createRefreshToken(): string {
    return crypto.randomBytes(48).toString("hex");
  }

  async login(
    input: LoginInput,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await authRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid email or password", 401);
    }
    if (user.deletedAt) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid email or password", 401);
    }
    if (!user.passwordHash) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Use SSO to sign in", 401);
    }
    if (user.agencyId) {
      const agency = await agencyRepository.findById(user.agencyId);
      if (agency?.ssoEnforced) {
        throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Use SSO to sign in", 401);
      }
    }
    if (user.status === "DISABLED") {
      throw new AppError(ERROR_CODES.AUTH_USER_DISABLED, "Account is disabled", 403);
    }
    if (user.status === "SUSPENDED") {
      throw new AppError(ERROR_CODES.AUTH_USER_DISABLED, "Account is suspended", 403);
    }
    if (user.status === "INVITED") {
      throw new AppError(ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED, "Please set your password using the invitation link to sign in", 403);
    }
    if (user.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED, "Please verify your email to sign in", 403);
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid email or password", 401);
    }

    if (input.agencySlug) {
      const agency = await agencyRepository.findBySlug(input.agencySlug);
      if (!agency || agency.status !== "ACTIVE") {
        throw new AppError(ERROR_CODES.AGENCY_NOT_FOUND, "Agency not found", 404);
      }
      const roleName = user.roleRef?.name ?? (user as { role?: string }).role;
      if (roleName === ROLES.SUPER_ADMIN || user.agencyId !== agency.id) {
        throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Invalid email or password", 401);
      }
    }

    const { auditLogin } = await import("../../lib/audit.js");
    await auditLogin({
      userId: user.id,
      agencyId: user.agencyId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
    return this.issueTokens(user, meta);
  }

  /**
   * Issue access + refresh tokens for a known user. Used by login and SSO callback.
   * Reuses same session and JWT shape as local login.
   */
  async issueTokens(
    user: Awaited<ReturnType<typeof authRepo.findById>>,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    if (user.deletedAt || user.status !== "ACTIVE") {
      throw new AppError(ERROR_CODES.AUTH_USER_DISABLED, "Account is not active", 403);
    }
    await authRepo.updateLastLoginAt(user.id);
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await authRepo.createSession({
      userId: user.id,
      refreshTokenHash,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      expiresAt,
    });
    const { role, roleId } = this.roleNameAndId(user);
    const roleVersion = user.roleRef?.permissionsVersion ?? 1;
    await authRepo.updatePermissionSnapshotVersion(user.id, roleVersion);
    const accessToken = this.createAccessToken({
      userId: user.id,
      agencyId: user.agencyId,
      role,
      roleId,
      permissionSnapshotVersion: roleVersion,
    });
    const requestCache: RequestPermissionCache = new Map();
    const permissionsSet = await getPermissionsForUser(user, requestCache);
    const permissions = Array.from(permissionsSet);
    const sanitized = this.sanitizeUser(user);
    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: { ...sanitized, isSuperAdmin: role === ROLES.SUPER_ADMIN },
      permissions,
      permissionVersion: PERMISSION_VERSION,
    };
  }

  /** Register creates a normal user only. Role is always USER; SUPER_ADMIN is never created here. */
  async register(input: RegisterInput) {
    const { get: getSystemConfig } = await import("../../services/SystemConfigCache.js");
    const config = getSystemConfig();
    if (!config.allowRegistration) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Registration is currently disabled", 403);
    }
    const existing = await authRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS, "User with this email already exists", 409);
    }
    const systemUserRole = await roleRepo.findSystemRoleByName(ROLES.USER);
    if (!systemUserRole) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, "System role USER not found. Run seed.", 500);
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const status: UserStatus = env.REQUIRE_EMAIL_VERIFICATION ? USER_STATUS.PENDING_VERIFICATION : USER_STATUS.ACTIVE;
    const user = await authRepo.createUser({
      email: input.email,
      passwordHash,
      displayName: input.name?.trim() || null,
      roleId: systemUserRole.id,
      status,
    });
    if (env.REQUIRE_EMAIL_VERIFICATION) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await authRepo.createEmailVerification(user.id, token, expiresAt);
      await this.sendVerificationEmail(user.email, token, this.userDisplayName(user));
      return {
        code: RESPONSE_CODES.EMAIL_VERIFICATION_REQUIRED,
        message: "Please check your email to verify your account",
        user: this.sanitizeUser(user),
      };
    }
    const refreshToken = this.createRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await authRepo.createSession({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    });
    const { role, roleId } = this.roleNameAndId(user);
    const roleVersion = user.roleRef?.permissionsVersion ?? 1;
    await authRepo.updatePermissionSnapshotVersion(user.id, roleVersion);
    const accessToken = this.createAccessToken({
      userId: user.id,
      agencyId: user.agencyId,
      role,
      roleId,
      permissionSnapshotVersion: roleVersion,
    });
    const requestCache: RequestPermissionCache = new Map();
    const permissionsSet = await getPermissionsForUser(user, requestCache);
    const permissions = Array.from(permissionsSet);
    const sanitized = this.sanitizeUser(user);
    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: { ...sanitized, isSuperAdmin: role === ROLES.SUPER_ADMIN },
      permissions,
      permissionVersion: PERMISSION_VERSION,
    };
  }

  async refresh(input: RefreshInput) {
    const hash = this.hashRefreshToken(input.refreshToken);
    const session = await authRepo.findSessionByRefreshTokenHash(hash);
    if (!session || session.expiresAt < new Date()) {
      if (session) await authRepo.deleteSessionById(session.id);
      throw new AppError(ERROR_CODES.AUTH_SESSION_EXPIRED, "Session expired", 401);
    }
    const user = session.user;
    if (user.deletedAt || user.status !== "ACTIVE") {
      await authRepo.deleteSessionById(session.id);
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Invalid session", 401);
    }
    const { role, roleId } = this.roleNameAndId(user);
    const roleVersion = user.roleRef?.permissionsVersion ?? 1;
    await authRepo.updatePermissionSnapshotVersion(user.id, roleVersion);
    const accessToken = this.createAccessToken({
      userId: user.id,
      agencyId: user.agencyId,
      role,
      roleId,
      permissionSnapshotVersion: roleVersion,
    });
    const requestCache: RequestPermissionCache = new Map();
    const permissionsSet = await getPermissionsForUser(user, requestCache);
    const permissions = Array.from(permissionsSet);
    const sanitized = this.sanitizeUser(user);
    return {
      accessToken,
      expiresIn: 900,
      user: { ...sanitized, isSuperAdmin: role === ROLES.SUPER_ADMIN },
      permissions,
      permissionVersion: PERMISSION_VERSION,
    };
  }

  async logout(refreshToken: string) {
    const hash = this.hashRefreshToken(refreshToken);
    const session = await authRepo.findSessionByRefreshTokenHash(hash);
    if (session) await authRepo.deleteSessionById(session.id);
  }

  async verifyEmail(input: VerifyEmailInput) {
    const verification = await authRepo.findEmailVerificationByToken(input.token);
    if (!verification) {
      throw new AppError(ERROR_CODES.EMAIL_VERIFICATION_EXPIRED, "Invalid or expired verification link", 400);
    }
    if (verification.expiresAt < new Date()) {
      await authRepo.deleteEmailVerificationById(verification.id);
      throw new AppError(ERROR_CODES.EMAIL_VERIFICATION_EXPIRED, "Verification link has expired", 400);
    }
    await authRepo.setEmailVerified(verification.userId);
    await authRepo.deleteEmailVerificationById(verification.id);
    return { message: "Email verified. You can now log in to your account." };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await authRepo.findByEmail(input.email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await authRepo.createPasswordReset(user.id, token, expiresAt);
      await this.sendPasswordResetEmail(user.email, token, this.userDisplayName(user));
    }
    return { message: "If an account exists, you will receive a password reset link" };
  }

  async resetPassword(input: ResetPasswordInput) {
    const reset = await authRepo.findPasswordResetByToken(input.token);
    if (!reset || reset.expiresAt < new Date()) {
      if (reset) await authRepo.deletePasswordResetsByUserId(reset.userId);
      throw new AppError(ERROR_CODES.PASSWORD_RESET_EXPIRED, "Invalid or expired reset link", 400);
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const prisma = getPrismaForInternalUse();
    await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      await tx.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      });
      await tx.user.updateMany({
        where: { id: reset.userId, status: "INVITED" },
        data: { emailVerifiedAt: new Date(), status: "ACTIVE" as UserStatus },
      });
      await tx.passwordReset.deleteMany({ where: { userId: reset.userId } });
    });
    return { message: "Password has been reset" };
  }

  createAccessTokenForVerify(payload: JwtPayload): string {
    return this.createAccessToken(payload);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err) {
      if (err && typeof err === "object" && "name" in err && err.name === "TokenExpiredError") {
        throw new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, "Token expired. Please sign in again.", 401);
      }
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Invalid or expired token", 401);
    }
  }

  /**
   * Verifies token and ensures permission snapshot version matches role (invalidates session when role permissions changed).
   */
  async verifyAccessTokenWithPermissionCheck(token: string): Promise<JwtPayload> {
    const payload = this.verifyAccessToken(token);
    if (payload.roleId != null) {
      const role = await roleRepo.findRoleById(payload.roleId);
      const snapshotVersion = payload.permissionSnapshotVersion ?? 0;
      if (role && role.permissionsVersion !== snapshotVersion) {
        throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Permissions updated. Please re-login.", 401);
      }
    }
    return payload;
  }

  async getMe(
    userId: string,
    context?: { impersonation?: boolean; agencyId?: string | null }
  ) {
    const user = await authRepo.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    }
    const { role } = this.roleNameAndId(user);
    const requestCache: RequestPermissionCache = new Map();
    const permissionsSet = await getPermissionsForUser(user, requestCache);
    const permissions = Array.from(permissionsSet);
    const sanitized = this.sanitizeUser(user);
    const userPayload = {
      ...sanitized,
      isSuperAdmin: role === ROLES.SUPER_ADMIN,
    };
    if (context?.impersonation && context?.agencyId && user.agencyId !== context.agencyId) {
      const agency = await agencyRepository.findById(context.agencyId);
      return {
        user: {
          ...userPayload,
          impersonation: true,
          impersonatingAgency: agency ? { id: agency.id, name: agency.name } : null,
        },
        permissions,
        permissionVersion: PERMISSION_VERSION,
      };
    }
    return {
      user: { ...userPayload, impersonation: false, impersonatingAgency: null },
      permissions,
      permissionVersion: PERMISSION_VERSION,
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await authRepo.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    }
    if (!user.passwordHash) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "SSO users do not have a password to change", 400);
    }
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, "Current password is incorrect", 400);
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await authRepo.updatePassword(userId, passwordHash);
    return { message: "Password has been changed" };
  }

  async logoutAllDevices(userId: string) {
    await authRepo.deleteSessionsByUserId(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await authRepo.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    }
    const data: Parameters<typeof authRepo.updateProfile>[1] = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || null;
    if (input.jobTitle !== undefined) data.jobTitle = input.jobTitle;
    if (input.department !== undefined) data.department = input.department;
    if (input.preferences !== undefined) data.preferences = input.preferences as Record<string, unknown>;
    const updated = await authRepo.updateProfile(userId, data);
    return this.sanitizeUser(updated);
  }

  async getSessions(userId: string) {
    const sessions = await authRepo.findSessionsByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async logoutOtherSessions(userId: string, currentRefreshToken: string) {
    const hash = this.hashRefreshToken(currentRefreshToken);
    const current = await authRepo.findSessionByRefreshTokenHash(hash);
    const exceptId = current?.userId === userId ? current.id : null;
    const result = await authRepo.deleteSessionsByUserIdExcept(userId, exceptId);
    return { count: result.count };
  }

  /** List active sessions for the tenant (agency). Caller must have USER_LIST or be superadmin. */
  async getSessionsForTenant(agencyId: string) {
    const rows = await authRepo.findSessionsByAgencyId(agencyId);
    return rows.map((s) => ({
      id: s.id,
      userId: s.user.id,
      userEmail: s.user.email,
      userName: s.user.displayName,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  /** Revoke a session by id. Allowed: own session, tenant admin for session in same agency, superadmin. Returns details for audit. */
  async revokeSessionById(
    sessionId: string,
    caller: { userId: string; agencyId: string | null; isSuperAdmin?: boolean },
    hasTenantAdminPermission: boolean
  ): Promise<{ sessionId: string; targetUserId: string }> {
    const session = await authRepo.findSessionById(sessionId);
    if (!session) {
      throw new AppError(ERROR_CODES.SESSION_NOT_FOUND, "Session not found", 404);
    }
    const isOwn = session.userId === caller.userId;
    const sameAgency = session.user.agencyId !== null && session.user.agencyId === caller.agencyId;
    const canRevoke =
      isOwn ||
      (caller.isSuperAdmin === true) ||
      (hasTenantAdminPermission && sameAgency);
    if (!canRevoke) {
      throw new AppError(ERROR_CODES.PERMISSION_DENIED, "Cannot revoke this session", 403);
    }
    await authRepo.deleteSessionById(sessionId);
    return { sessionId, targetUserId: session.userId };
  }

  private async sendVerificationEmail(email: string, token: string, userName: string | null) {
    const link = `${env.CORS_ORIGIN}/verify-email?token=${token}`;
    const sent = await sendVerificationEmailMail(email, userName, link);
    if (!sent && env.NODE_ENV === "development") {
      console.log("[auth] Verification link (no SMTP):", link);
    }
  }

  private async sendPasswordResetEmail(email: string, token: string, userName: string | null) {
    const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
    const sent = await sendPasswordResetEmailMail(email, userName, link, "60");
    if (!sent && env.NODE_ENV === "development") {
      console.log("[auth] Password reset link (no SMTP):", link);
    }
  }

  private userDisplayName(user: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): string | null {
    if (user.displayName?.trim()) return user.displayName.trim();
    const parts = [user.firstName, user.lastName].filter((s) => s != null && String(s).trim() !== "");
    return parts.length > 0 ? parts.join(" ").trim() : null;
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    preferences?: unknown;
    role?: string | null;
    roleRef?: { id: string; name: string } | null;
    status: string;
    agencyId: string | null;
    emailVerifiedAt?: Date | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    agency?: { id: string; name: string; slug: string; onboardingCompleted: boolean } | null;
  }) {
    const role = user.roleRef?.name ?? user.role ?? "USER";
    return {
      id: user.id,
      email: user.email,
      name: this.userDisplayName(user),
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      displayName: user.displayName ?? null,
      phone: user.phone ?? null,
      avatarUrl: user.avatarUrl ?? null,
      jobTitle: user.jobTitle ?? null,
      department: user.department ?? null,
      preferences: user.preferences ?? {},
      role,
      status: user.status,
      agencyId: user.agencyId,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      agency: user.agency
        ? {
            id: user.agency.id,
            name: user.agency.name,
            slug: user.agency.slug,
            onboardingCompleted: user.agency.onboardingCompleted ?? true,
          }
        : null,
    };
  }
}
