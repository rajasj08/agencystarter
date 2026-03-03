import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "auth.passwordMin"),
    confirmPassword: z.string().min(1, "auth.confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.passwordMismatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
