"use client";

import * as React from "react";
import { AppButton } from "@/components/design";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  page,
  limit,
  total,
  onPageChange,
  className,
}: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 border-t border-border text-sm text-text-secondary",
        className
      )}
    >
      <span>
        {total === 0 ? "0 items" : `${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <AppButton
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </AppButton>
        <span className="min-w-[6rem] text-center">
          Page {page} of {pages}
        </span>
        <AppButton
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </AppButton>
      </div>
    </div>
  );
}
