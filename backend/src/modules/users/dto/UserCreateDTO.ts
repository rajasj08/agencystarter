/**
 * Input DTO for creating a user (or inviting). Used by POST /users.
 */
export interface UserCreateDTO {
  email: string;
  name?: string | null;
  role: string;
  invite?: boolean;
  password?: string;
}
