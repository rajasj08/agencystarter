"use client";

import { useState, useCallback } from "react";

export type SortOrder = "asc" | "desc";

export interface UseSortOptions<T extends string = string> {
  initialSortBy?: T;
  initialSortOrder?: SortOrder;
}

export interface UseSortReturn<T extends string = string> {
  sortBy: T | undefined;
  sortOrder: SortOrder;
  setSort: (sortBy: T | undefined, sortOrder?: SortOrder) => void;
  toggleOrder: () => void;
  reset: () => void;
}

export function useSort<T extends string = string>(
  options: UseSortOptions<T> = {}
): UseSortReturn<T> {
  const [sortBy, setSortBy] = useState<T | undefined>(options.initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(options.initialSortOrder ?? "desc");

  const setSort = useCallback((by: T | undefined, order: SortOrder = "desc") => {
    setSortBy(by);
    setSortOrder(order);
  }, []);

  const toggleOrder = useCallback(() => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  }, []);

  const reset = useCallback(() => {
    setSortBy(options.initialSortBy);
    setSortOrder(options.initialSortOrder ?? "desc");
  }, [options.initialSortBy, options.initialSortOrder]);

  return {
    sortBy,
    sortOrder,
    setSort,
    toggleOrder,
    reset,
  };
}
