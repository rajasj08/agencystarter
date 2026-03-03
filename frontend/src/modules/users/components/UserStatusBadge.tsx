"use client";

import { cn } from "@/lib/utils";
import type { UserStatus } from "../types/userTypes";

const statusConfig: Record<UserStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-success/15 text-success border-success/30" },
  DISABLED: { label: "Disabled", className: "bg-muted text-text-secondary border-border" },
  SUSPENDED: { label: "Suspended", className: "bg-warning/15 text-warning border-warning/30" },
  INVITED: { label: "Invited", className: "bg-primary/15 text-primary border-primary/30" },
};

export interface UserStatusBadgeProps {
  status: UserStatus | string;
  className?: string;
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  const config = statusConfig[status as UserStatus] ?? {
    label: String(status),
    className: "bg-muted text-text-secondary border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
