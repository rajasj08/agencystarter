import { z } from "zod";

const passwordMin = 8;

export const registerSchema = z
  .object({
    email: z.string().min(1, "auth.emailRequired").email("auth.emailInvalid"),
    name: z.string().optional(),
    password: z.string().min(passwordMin, "auth.passwordMin"),
    confirmPassword: z.string().min(1, "auth.confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.passwordMismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
