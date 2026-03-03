"use client";

import { useState, useCallback } from "react";

export type FilterValue = string | number | boolean | undefined | null;

export interface UseFiltersReturn {
  filters: Record<string, FilterValue>;
  setFilter: (key: string, value: FilterValue) => void;
  setFilters: (f: Record<string, FilterValue> | ((prev: Record<string, FilterValue>) => Record<string, FilterValue>)) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
}

export function useFilters(initial: Record<string, FilterValue> = {}): UseFiltersReturn {
  const [filters, setFiltersState] = useState<Record<string, FilterValue>>(initial);

  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback(
    (f: Record<string, FilterValue> | ((prev: Record<string, FilterValue>) => Record<string, FilterValue>)) => {
      setFiltersState(typeof f === "function" ? f : () => f);
    },
    []
  );

  const clearFilter = useCallback((key: string) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setFiltersState(initial), [initial]);

  const hasActiveFilters = Object.keys(filters).some(
    (k) => filters[k] !== undefined && filters[k] !== null && filters[k] !== ""
  );

  return {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearAll,
    hasActiveFilters,
  };
}
