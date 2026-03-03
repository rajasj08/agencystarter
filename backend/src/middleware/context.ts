import type { Request, Response, NextFunction } from "express";
import type { RequestContext } from "../types/index.js";

export interface RequestWithContext extends Request {
  requestId?: string;
  context?: RequestContext;
}

/**
 * Builds RequestContext from request (requestId, ip, userAgent). Run after requestId.
 * When auth middleware runs later, it augments req.context with userId, role, agencyId.
 */
export function contextMiddleware(req: RequestWithContext, _res: Response, next: NextFunction): void {
  req.context = {
    requestId: req.requestId ?? "",
    ip: req.ip ?? req.socket?.remoteAddress,
    userAgent: req.get("user-agent") ?? undefined,
  };
  next();
}
