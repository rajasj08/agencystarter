import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

const HEADER = "x-request-id";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers[HEADER] as string) || crypto.randomUUID();
  (req as Request & { requestId: string }).requestId = id;
  res.setHeader(HEADER, id);
  next();
}
