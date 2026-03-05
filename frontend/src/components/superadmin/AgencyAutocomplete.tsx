"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAgencies, getAgencyById, type AgencyListItem } from "@/services/superadmin";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;
const DROPDOWN_LIMIT = 10;

export interface AgencyAutocompleteProps {
  value: string;
  onChange: (agencyId: string) => void;
  placeholder?: string;
  activeOnly?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function AgencyAutocomplete({
  value,
  onChange,
  placeholder = "Select agency",
  activeOnly = true,
  disabled = false,
  error,
  className,
}: AgencyAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [options, setOptions] = useState<AgencyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchAgencies = useCallback(
    (searchTerm: string) => {
      setLoading(true);
      getAgencies({
        limit: DROPDOWN_LIMIT,
        search: searchTerm || undefined,
        sortBy: searchTerm ? "name" : "createdAt",
        order: searchTerm ? "asc" : "desc",
      })
        .then(({ data }) => setOptions(activeOnly ? data.filter((a) => a.status === "ACTIVE") : data))
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    },
    [activeOnly]
  );

  useEffect(() => {
    if (!open) return;
    fetchAgencies(search);
  }, [open, search, fetchAgencies]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!value) {
      setSelectedName(null);
      return;
    }
    const inOptions = options.find((a) => a.id === value);
    if (inOptions) setSelectedName(inOptions.name);
    else {
      getAgencyById(value)
        .then((a) => setSelectedName(a.name))
        .catch(() => setSelectedName(null));
    }
  }, [value, options]);

  const selectedLabel = value ? (selectedName ?? options.find((a) => a.id === value)?.name ?? "Agency") : placeholder;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full min-w-[180px] items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-text-primary hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500"
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-text-secondary", open && "rotate-180")} />
        </button>
        {open && (
          <div
            className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-md border border-border bg-card shadow-lg"
            role="listbox"
          >
            <div className="border-b border-border p-2">
              <input
                type="search"
                placeholder="Search agencies..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                aria-label="Search agencies"
              />
            </div>
            <ul className="max-h-[240px] overflow-auto py-1">
              {loading ? (
                <li className="px-3 py-4 text-center text-sm text-text-secondary">Loading…</li>
              ) : options.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-text-secondary">No agencies found</li>
              ) : (
                options.map((agency) => (
                  <li key={agency.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(agency.id);
                        setSelectedName(agency.name);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                        value === agency.id && "bg-muted font-medium"
                      )}
                      role="option"
                      aria-selected={value === agency.id}
                    >
                      {agency.name}
                      {agency.slug && (
                        <span className="ml-1 text-text-secondary">({agency.slug})</span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
