/**
 * Input DTO for updating a user. Used by PATCH /users/:id.
 */
export interface UserUpdateDTO {
  name?: string | null;
  role?: string;
  status?: "ACTIVE" | "DISABLED" | "SUSPENDED";
}
