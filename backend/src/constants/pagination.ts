/**
 * Standard pagination defaults and limits.
 */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export function clampLimit(limit: number): number {
  return Math.min(Math.max(1, limit), PAGINATION.MAX_LIMIT);
}

export function clampPage(page: number): number {
  return Math.max(1, Math.floor(page));
}
