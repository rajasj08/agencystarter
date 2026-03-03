import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { sendError } from "../api/response.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.errors);
    return;
  }

  logger.error("Unhandled error", err);
  sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    "An unexpected error occurred",
    500
  );
}
