import type { UserStatus } from "@prisma/client";
import type { UserAgencyRef } from "../user.types.js";

export interface UserEditorRef {
  id: string;
  name: string;
  email: string;
}

export interface UserPublicDTO {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  role: string;
  agencyId: string | null;
  agency: UserAgencyRef | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: UserEditorRef | null;
}

function rowDisplayName(row: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string | null {
  if (row.displayName?.trim()) return row.displayName.trim();
  const parts = [row.firstName, row.lastName].filter((s) => s != null && String(s).trim() !== "");
  return parts.length > 0 ? parts.join(" ").trim() : null;
}

function editorDisplayName(u: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  if (u.displayName?.trim()) return u.displayName.trim();
  const parts = [u.firstName, u.lastName].filter((s) => s != null && String(s).trim() !== "");
  return parts.length > 0 ? parts.join(" ").trim() : u.email;
}

export function toUserPublicDTO(row: {
  id: string;
  email: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status: UserStatus;
  role?: string | null;
  roleRef?: { id: string; name: string } | null;
  agencyId: string | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  agency?: { id: string; name: string; slug: string; onboardingCompleted: boolean } | null;
  updatedBy?: { id: string; email: string; displayName: string | null; firstName: string | null; lastName: string | null } | null;
}): UserPublicDTO {
  const role = row.roleRef?.name ?? row.role ?? "USER";
  const updatedBy: UserPublicDTO["updatedBy"] = row.updatedBy
    ? { id: row.updatedBy.id, email: row.updatedBy.email, name: editorDisplayName(row.updatedBy) }
    : null;
  return {
    id: row.id,
    email: row.email,
    name: rowDisplayName(row),
    status: row.status,
    role,
    agencyId: row.agencyId,
    agency: row.agency
      ? {
          id: row.agency.id,
          name: row.agency.name,
          slug: row.agency.slug,
          onboardingCompleted: row.agency.onboardingCompleted,
        }
      : null,
    emailVerifiedAt: row.emailVerifiedAt,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy,
  };
}
