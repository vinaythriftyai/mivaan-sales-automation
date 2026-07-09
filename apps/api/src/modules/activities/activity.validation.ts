import { z } from "zod";

export const createActivitySchema = z.object({
  partyId: z.string().min(1, "Party ID is required"),

  type: z.enum([
    "PHONE_CALL",
    "EMAIL",
    "WHATSAPP",
    "VISIT",
    "OFFER",
    "PRICE_COMMUNICATION",
    "NOTE",
  ]),

  activityAt: z.coerce.date().optional(),

  summary: z
    .string()
    .trim()
    .min(3, "Summary must contain at least 3 characters")
    .max(3000),

  outcome: z.string().trim().max(3000).optional(),

  nextFollowUpAt: z.coerce.date().optional(),
});
export const completeFollowUpSchema = z.object({
  completionNote: z.string().trim().max(2000).optional(),
});
