/**
 * Domain and shared types. Prefer over inline types across the backend.
 */

/** Authenticated request user; matches JWT payload. */
export interface AuthUser {
  userId: string;
  role: string;
  agencyId: string | null;
}

/** Tenant context for scoped queries and mutations. */
export interface TenantContext {
  agencyId: string;
}

/** Options for paginated list operations (from query or service). */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

/** Result shape for paginated list (data + total). */
export interface PaginationResult<T> {
  data: T[];
  total: number;
}

/**
 * Request-scoped context for logging, tracing, and passing into services.
 * Set by middleware after requestId (and optionally auth). Include requestId in logs.
 */
export interface RequestContext {
  requestId: string;
  ip: string | undefined;
  userAgent: string | undefined;
  userId?: string;
  role?: string;
  agencyId?: string | null;
}
