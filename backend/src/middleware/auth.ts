import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/auth.service.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import type { RequestContext } from "../types/index.js";

const authService = new AuthService();

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
  };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_INVALID, "Authorization required", 401);
  }
  try {
    const payload = authService.verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      roleId: payload.roleId ?? null,
      agencyId: payload.agencyId,
      isSuperAdmin: payload.isSuperAdmin,
      impersonation: payload.impersonation,
    };
    if (req.context) {
      req.context.userId = payload.userId;
      req.context.role = payload.role;
      req.context.agencyId = payload.agencyId;
    }
    next();
  } catch {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, "Invalid or expired token", 401);
  }
}
