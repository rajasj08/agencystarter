"use client";

import type { AuthUser } from "@/services/auth";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface AccountInfoSectionProps {
  user: AuthUser | null;
}

export function AccountInfoSection({ user }: AccountInfoSectionProps) {
  if (!user) return null;

  const rows = [
    { label: "User ID", value: user.id },
    { label: "Agency name", value: user.agency?.name ?? "—" },
    { label: "Role", value: user.role },
    { label: "Status", value: user.status },
    { label: "Created date", value: formatDate(user.createdAt) },
    { label: "Last login", value: formatDate(user.lastLoginAt) },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-sm font-medium text-text-secondary">{label}</dt>
          <dd className="mt-0.5 text-sm text-text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
