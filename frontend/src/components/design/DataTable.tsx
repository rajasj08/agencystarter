"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "./TablePagination";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** When set, column header is sortable and this key is sent to onSort. */
  sortKey?: string;
}

export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableSort {
  sortBy: string | null;
  sortOrder: "asc" | "desc";
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: React.ReactNode;
  className?: string;
  /** When set, shows pagination bar below the table. */
  pagination?: DataTablePagination;
  /** When set, column headers with sortKey become clickable. */
  sort?: DataTableSort;
  loading?: boolean;
}

function DataTableInner<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data",
  className,
  pagination,
  sort,
  loading = false,
}: DataTableProps<T>) {
  const handleSort = (sortKey: string) => {
    if (!sort) return;
    const nextOrder =
      sort.sortBy === sortKey && sort.sortOrder === "asc" ? "desc" : "asc";
    sort.onSort(sortKey, nextOrder);
  };

  return (
    <div className={cn("rounded-lg border border-border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.sortKey ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                    onClick={() => handleSort(col.sortKey!)}
                  >
                    {col.header}
                    {sort?.sortBy === col.sortKey && (
                      sort.sortOrder === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-text-secondary">
                Loading…
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-text-secondary">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination && !loading && (
        <TablePagination
          page={pagination.page}
          limit={pagination.limit}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

export function DataTable<T>(props: DataTableProps<T>) {
  return <DataTableInner {...props} />;
}
