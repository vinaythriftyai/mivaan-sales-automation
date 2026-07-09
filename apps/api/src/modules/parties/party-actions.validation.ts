import { z } from "zod";

export const partyDecisionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(
      5,
      "Decision reason must contain at least 5 characters"
    )
    .max(
      2000,
      "Decision reason cannot exceed 2000 characters"
    )
});