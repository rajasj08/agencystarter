/**
 * Shared API response shapes. Keep in sync with backend core/BaseController.
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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  code: string;
  message: string;
  data: T[];
  meta: PaginationMeta;
}
