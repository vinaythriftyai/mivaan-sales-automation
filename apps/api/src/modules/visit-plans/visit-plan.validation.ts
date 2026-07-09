import { z } from "zod";

//port { PartySource } from "../../common/types/workflow-enums.js";
import { PartySource } from "../../common/types/workflows-enums.js";
const visitPlanItemSchema = z.object({
  partyId: z.string().min(1),
  partySource: z.nativeEnum(PartySource),
  customerNameSnapshot: z.string().trim().min(2),
  productRange: z.array(z.string()).default([]),
  lastVisitedAt: z.coerce.date().optional(),
  dispatchQtyLastThreeMonthsMt: z.number().nonnegative().default(0),
  remarks: z.string().trim().optional()
});

export const createVisitPlanSchema = z
  .object({
    division: z.string().trim().min(1),
    camId: z.string().min(1),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
    area: z.string().trim().min(1),
    city: z.string().trim().min(1),
    items: z.array(visitPlanItemSchema).min(1)
  })
  .refine(
    data => data.dateTo >= data.dateFrom,
    {
      message: "dateTo must be greater than or equal to dateFrom",
      path: ["dateTo"]
    }
  );

export const rejectVisitPlanSchema = z.object({
  reason: z.string().trim().min(3).max(1000)
});