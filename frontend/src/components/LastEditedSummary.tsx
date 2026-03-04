"use client";

import { Card } from "@/components/ui/card";

/** Editor info returned by APIs for "last edited by" (e.g. plan, agency). */
export interface EditorInfo {
  id: string;
  name: string;
  email: string;
}

export interface LastEditedSummaryProps {
  /** ISO date string (e.g. from API updatedAt). */
  updatedAt: string;
  /** Resolved editor user; when null/undefined show "—". */
  updatedBy?: EditorInfo | null;
  /** Optional class for the card. */
  className?: string;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Shared summary card for management edit pages: shows last edited date and who edited (by name).
 * Use on plan edit, agency edit, user edit, etc.
 */
export function LastEditedSummary({ updatedAt, updatedBy, className }: LastEditedSummaryProps) {
  return (
    <Card className={`sticky top-6 rounded-2xl border border-border p-6 shadow-sm ${className ?? ""}`}>
      <h3 className="mb-4 text-sm font-medium text-text-primary">Summary</h3>
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-gray-500">Last edited</p>
          <p className="font-medium text-text-primary">{formatDateTime(updatedAt)}</p>
        </div>
        <div>
          <p className="text-gray-500">Edited by</p>
          <p className="font-medium text-text-primary">{updatedBy?.name ?? "—"}</p>
        </div>
      </div>
    </Card>
  );
}
