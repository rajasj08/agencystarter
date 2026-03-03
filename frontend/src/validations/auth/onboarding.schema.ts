import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "agency.nameRequired"),
  slug: z.string().min(1, "agency.slugRequired").regex(/^[a-z0-9-]+$/, "agency.slugInvalid"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
