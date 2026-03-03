"use client";

import { useState, useCallback } from "react";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
  offset: number;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(options.initialPage ?? DEFAULT_PAGE);
  const [limit, setLimit] = useState(options.initialLimit ?? DEFAULT_LIMIT);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const reset = useCallback(() => {
    setPage(DEFAULT_PAGE);
    setLimit(DEFAULT_LIMIT);
  }, []);

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    reset,
    offset,
  };
}
