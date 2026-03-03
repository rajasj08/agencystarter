import type { Response } from "express";
import { RESPONSE_CODES } from "../constants/responseCodes.js";
import type { ApiSuccessResponse, ApiErrorResponse } from "../core/BaseController.js";

export function sendSuccess<T>(res: Response, data: T, code: string = RESPONSE_CODES.SUCCESS, message = ""): void {
  const body: ApiSuccessResponse<T> = { success: true, code, message, data };
  res.json(body);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number,
  errors?: unknown[]
): void {
  const body: ApiErrorResponse = { success: false, code, message, errors };
  res.status(statusCode).json(body);
}
