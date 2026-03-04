/**
 * Role module types. Align with backend roles API.
 */

export interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface RoleEditor {
  id: string;
  name: string;
  email: string;
}

export interface Role {
  id: string;
  name: string;
  agencyId: string | null;
  isSystem: boolean;
  permissionIds: string[];
  updatedAt?: string;
  updatedBy?: RoleEditor | null;
}

export interface RoleDetail extends Role {}

export interface RoleCreateInput {
  name: string;
  permissionIds: string[];
}

export interface RoleUpdateInput {
  name?: string;
  permissionIds?: string[];
}
