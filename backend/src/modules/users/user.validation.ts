import { z } from "zod";
import { ROLES } from "../../constants/roles.js";

const ROLE_VALUES = Object.values(ROLES) as [string, ...string[]];

export const createUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().max(255).optional().nullable(),
    role: z.enum(ROLE_VALUES),
    invite: z.boolean().optional().default(false),
    password: z.string().min(8).optional(),
  })
  .refine((data) => data.invite === true || (data.password != null && data.password.length >= 8), {
    message: "Password is required when not inviting",
    path: ["password"],
  });

export const updateUserSchema = z
  .object({
    name: z.string().max(255).optional().nullable(),
    role: z.enum(ROLE_VALUES).optional(),
    status: z.enum(["ACTIVE", "DISABLED", "SUSPENDED"]).optional(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
