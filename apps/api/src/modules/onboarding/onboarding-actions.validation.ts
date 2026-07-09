import { z } from "zod";

export const approveOnboardingSchema = z.object({
  comment: z
    .string()
    .trim()
    .max(2000)
    .optional()
});

export const rejectOnboardingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Rejection reason must contain at least 5 characters")
    .max(2000)
});