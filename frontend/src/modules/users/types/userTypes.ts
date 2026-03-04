/**
 * User module types. Align with backend UserPublicDTO / create / update.
 */

export type UserStatus = "ACTIVE" | "DISABLED" | "SUSPENDED" | "INVITED";

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
  agencyId: string | null;
  agency: UserAgencyRef | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: UserEditorRef | null;
}

export interface UserCreateInput {
  email: string;
  name?: string | null;
  role: string;
  invite?: boolean;
  password?: string;
}

export interface UserUpdateInput {
  name?: string | null;
  role?: string;
  status?: UserStatus;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: string;
}
