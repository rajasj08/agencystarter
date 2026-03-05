import type { Request, Response } from "express";
import { RESPONSE_CODES } from "../constants/responseCodes.js";
import { PAGINATION, clampLimit, clampPage } from "../constants/pagination.js";

/**
 * Unified API response shape.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  code: string;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: unknown[] | Record<string, unknown>;
}

/**
 * Standard pagination meta for list endpoints.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Paginated success response: data array + meta.
 */
export interface ApiPaginatedResponse<T> {
  success: true;
  code: string;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Base controller. All controllers extend this.
 * No direct Prisma; use services. Standardized responses.
 */
export abstract class BaseController {
  protected success<T>(res: Response, data: T, code: string = RESPONSE_CODES.SUCCESS, message = ""): void {
    const body: ApiSuccessResponse<T> = { success: true, code, message, data };
    res.json(body);
  }

  protected created<T>(res: Response, data: T, message = ""): void {
    this.success(res, data, RESPONSE_CODES.CREATED, message);
  }

  protected fail(res: Response, code: string, message: string, statusCode: number, errors?: unknown[] | Record<string, unknown>): void {
    const body: ApiErrorResponse = { success: false, code, message, errors };
    res.status(statusCode).json(body);
  }

  protected getBody<T = unknown>(req: Request): T {
    return req.body as T;
  }

  protected getParams(req: Request): Record<string, string> {
    return req.params as Record<string, string>;
  }

  protected getQuery<T = Record<string, unknown>>(req: Request): T {
    return req.query as T;
  }

  /**
   * Parse page and limit from query. Use with paginated().
   */
  protected getPagination(req: Request): { page: number; limit: number; offset: number } {
    const query = this.getQuery<{ page?: string; limit?: string }>(req);
    const page = clampPage(parseInt(query.page ?? String(PAGINATION.DEFAULT_PAGE), 10) || PAGINATION.DEFAULT_PAGE);
    const limit = clampLimit(parseInt(query.limit ?? String(PAGINATION.DEFAULT_LIMIT), 10) || PAGINATION.DEFAULT_LIMIT);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
  }

  /**
   * Parse sortBy and sortOrder from query. Returns undefined values if not present or invalid.
   */
  protected getSort(req: Request): { sortBy?: string; sortOrder?: "asc" | "desc" } {
    const query = this.getQuery<{ sortBy?: string; sortOrder?: string }>(req);
    const sortOrder = query.sortOrder === "asc" || query.sortOrder === "desc" ? query.sortOrder : undefined;
    const sortBy = typeof query.sortBy === "string" && query.sortBy.trim() !== "" ? query.sortBy.trim() : undefined;
    return { sortBy, sortOrder };
  }

  /**
   * Send paginated list response: data array + meta (total, page, limit, pages).
   */
  protected paginated<T>(
    res: Response,
    data: T[],
    total: number,
    meta: { page: number; limit: number },
    code: string = RESPONSE_CODES.SUCCESS,
    message = ""
  ): void {
    const pages = Math.max(1, Math.ceil(total / meta.limit));
    const body: ApiPaginatedResponse<T> = {
      success: true,
      code,
      message,
      data,
      meta: {
        total,
        page: meta.page,
        limit: meta.limit,
        pages,
      },
    };
    res.json(body);
  }
}
