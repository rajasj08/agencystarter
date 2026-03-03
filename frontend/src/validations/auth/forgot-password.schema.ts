import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "auth.emailRequired").email("auth.emailInvalid"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
