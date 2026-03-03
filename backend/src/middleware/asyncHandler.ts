import type { Request, Response, NextFunction } from "express";

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps async route handlers so Express catches rejections.
 */
export function asyncHandler(fn: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
