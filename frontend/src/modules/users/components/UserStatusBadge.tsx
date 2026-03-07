"use client";

import { cn } from "@/lib/utils";
import type { UserStatus } from "../types/userTypes";

/** Display-only status; not stored in DB (deleted users use deletedAt + status DISABLED). */
const statusConfig: Record<UserStatus | "DELETED" | "PENDING_VERIFICATION", { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-success/15 text-success border border-success/30" },
  DISABLED: { label: "Disabled", className: "bg-muted text-text-secondary border border-border" },
  SUSPENDED: { label: "Suspended", className: "bg-warning/15 text-warning border border-warning/30" },
  INVITED: { label: "Pending", className: "bg-primary/15 text-primary border border-primary/30" },
  PENDING_VERIFICATION: { label: "Pending", className: "bg-primary/15 text-primary border border-primary/30" },
  DELETED: { label: "Deleted", className: "bg-muted text-text-secondary border border-border" },
};

export interface UserStatusBadgeProps {
  status: UserStatus | string;
  className?: string;
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? {
    label: String(status),
    className: "bg-muted text-text-secondary border border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
