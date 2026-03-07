/**
 * User module types. Align with backend UserPublicDTO / create / update.
 */

export type UserStatus = "ACTIVE" | "DISABLED" | "SUSPENDED" | "INVITED" | "PENDING_VERIFICATION";

export interface UserAgencyRef {
  id: string;
  name: string;
  slug: string;
  onboardingCompleted: boolean;
}

export interface UserEditorRef {
  id: string;
  name: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  role: string;
  /** Present when backend includes roleRef/id; may be missing on older list responses. */
  roleId?: string | null;
  agencyId: string | null;
  agency: UserAgencyRef | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: UserEditorRef | null;
  /** Set when user is soft-deleted (list with status=DELETED). */
  deletedAt?: string | null;
}

export interface UserCreateInput {
  email: string;
  name?: string | null;
  roleId: string;
  invite?: boolean;
  password?: string;
}

/** Only ACTIVE, SUSPENDED, DISABLED are editable; INVITED and PENDING_VERIFICATION are system-controlled. */
export interface UserUpdateInput {
  name?: string | null;
  roleId?: string;
  status?: "ACTIVE" | "DISABLED" | "SUSPENDED";
}

export interface UserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: string;
}
