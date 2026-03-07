import { z } from "zod";

/** Role ID (CUID from Prisma). Validated in service via findRoleByIdAndAgency. */
const roleIdSchema = z.string().min(1, "Role is required").max(100);
/** Legacy: role name (e.g. for superadmin). Prefer roleId. */
const roleNameSchema = z.string().min(1).max(100).transform((s) => s.trim());

export const createUserSchema = z
  .object({
    email: z.string().email().transform((s) => s.trim().toLowerCase()),
    name: z.string().max(255).optional().nullable(),
    displayName: z.string().max(255).optional().nullable(),
    roleId: roleIdSchema.optional(),
    role: roleNameSchema.optional(),
    /** When true: status=INVITED, no password, send invitation email. When false: require password, status=ACTIVE. */
    invite: z.boolean().optional().default(false),
    sendInvitation: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => data.roleId != null || (data.role != null && data.role !== ""), {
    message: "Either roleId or role is required",
    path: ["roleId"],
  })
  .refine(
    (data) => {
      const asInvite = data.invite === true || data.sendInvitation === true;
      return asInvite === true || (data.password != null && data.password.length >= 8);
    },
    { message: "Password is required when not sending invitation", path: ["password"] }
  )
  .transform((data) => ({
    ...data,
    invite: data.invite === true || data.sendInvitation === true,
    displayName: data.displayName ?? data.name ?? null,
  }));

export const updateUserSchema = z
  .object({
    name: z.string().max(255).optional().nullable(),
    roleId: roleIdSchema.optional(),
    status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]).optional(),
  })
  .strict();

export const setPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
}).strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
