"use client";

import { AgencyFilter } from "@/components/superadmin/AgencyFilter";
import { AppButton } from "@/components/design";

export const USER_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
  { value: "DELETED", label: "Deleted" },
] as const;

export interface UserListFiltersProps {
  /** When true, show agency dropdown (superadmin). */
  showAgencyFilter?: boolean;
  agencyId?: string | null;
  onAgencyChange?: (agencyId: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  searchPlaceholder?: string;
  /** Extra content (e.g. Add user button) to show after filters. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared filters for user list pages: optional agency, search (email/name), status, reset.
 * Use showAgencyFilter=true for superadmin, false for agency dashboard.
 */
export function UserListFilters({
  showAgencyFilter = false,
  agencyId = null,
  onAgencyChange,
  search,
  onSearchChange,
  onSearchSubmit,
  status,
  onStatusChange,
  onReset,
  searchPlaceholder = "Search by email or name…",
  children,
  className,
}: UserListFiltersProps) {
  const hasActiveFilters =
    (showAgencyFilter && agencyId != null && agencyId !== "") ||
    search.trim() !== "" ||
    (status !== "" && status !== "All statuses");

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {showAgencyFilter && onAgencyChange && (
        <AgencyFilter value={agencyId} onChange={onAgencyChange} placeholder="All agencies" />
      )}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
        aria-label="Filter by status"
      >
        {USER_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary min-w-[200px]"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search users"
        />
        <AppButton type="submit" variant="outline">
          Search
        </AppButton>
      </form>
      {hasActiveFilters && (
        <AppButton type="button" variant="outline" onClick={onReset}>
          Reset
        </AppButton>
      )}
      {children}
    </div>
  );
}
