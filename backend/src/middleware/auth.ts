import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/auth.service.js";
import { ApiKeyService } from "../modules/api-keys/api-key.service.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import type { RequestContext } from "../types/index.js";

const authService = new AuthService();
const apiKeyService = new ApiKeyService();

export interface AuthRequest extends Request {
  requestId?: string;
  context?: RequestContext;
  user?: {
    userId: string;
    role: string;
    roleId?: string | null;
    agencyId: string | null;
    isSuperAdmin?: boolean;
    impersonation?: boolean;
    /** Token scope: platform | tenant. Enforces route scope (no tenant token on platform routes). */
    scope?: "platform" | "tenant";
    /** True when authenticated via API key (machine-to-machine). No impersonation; permissions from key. */
    isApiKey?: boolean;
    /** Set when isApiKey: true. Used by permission middleware. */
    apiKeyPermissions?: Set<string>;
  };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
  }

  if (authHeader.startsWith("ApiKey ")) {
    const plainKey = authHeader.slice(7).trim();
    if (!plainKey) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "API key required", 401);
    }
    apiKeyService
      .validateAndAttach(plainKey)
      .then((ctx) => {
        if (!ctx) {
          next(new AppError(ERROR_CODES.API_KEY_INVALID, "Invalid or revoked API key", 401));
          return;
        }
        req.user = {
          userId: ctx.userId,
          role: "API_KEY",
          roleId: null,
          agencyId: ctx.agencyId,
          isSuperAdmin: ctx.isSuperAdmin,
          impersonation: false,
          scope: ctx.scope,
          isApiKey: true,
          apiKeyPermissions: new Set(ctx.permissions),
        };
        if (req.context) {
          req.context.userId = ctx.userId;
          req.context.role = "API_KEY";
          req.context.agencyId = ctx.agencyId;
        }
        next();
      })
      .catch((err) => {
        if (err instanceof AppError) next(err);
        else next(new AppError(ERROR_CODES.API_KEY_INVALID, "Invalid API key", 401));
      });
    return;
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
  }
  authService
    .verifyAccessTokenWithPermissionCheck(token)
    .then((payload) => {
      req.user = {
        userId: payload.userId,
        role: payload.role,
        roleId: payload.roleId ?? null,
        agencyId: payload.agencyId,
        isSuperAdmin: payload.isSuperAdmin,
        impersonation: payload.impersonation,
        scope: payload.scope ?? (payload.isSuperAdmin && !payload.impersonation ? "platform" : "tenant"),
      };
      if (req.context) {
        req.context.userId = payload.userId;
        req.context.role = payload.role;
        req.context.agencyId = payload.agencyId;
      }
      next();
    })
    .catch((err) => {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      next(new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, "Invalid or expired token", 401));
    });
}
