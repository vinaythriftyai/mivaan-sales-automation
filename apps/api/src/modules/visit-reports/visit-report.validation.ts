import { z } from "zod";

export const createVisitReportSchema = z.object({
  visitPlanId: z.string().min(1),
  visitPlanItemId: z.string().min(1),
  partyId: z.string().min(1),
  camId: z.string().min(1),

  visitedAt: z.coerce.date(),

  contactPerson: z
    .string()
    .trim()
    .max(200)
    .optional(),

  customerType: z
    .string()
    .trim()
    .min(1),

  productCategory: z
    .string()
    .trim()
    .min(1),

  products: z
    .array(z.string().trim().min(1))
    .default([]),

  qtyApproxMt: z
    .number()
    .nonnegative()
    .optional(),

  productFit: z.boolean(),

  seriousness: z
    .enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"])
    .default("UNKNOWN"),

  expectedDemand: z
    .string()
    .trim()
    .max(3000)
    .optional(),

  outcomeSummary: z
    .string()
    .trim()
    .min(5)
    .max(5000),

  remarks: z
    .string()
    .trim()
    .max(5000)
    .optional(),

  lastFollowUpAt: z.coerce.date().optional(),
  nextFollowUpAt: z.coerce.date().optional()
});