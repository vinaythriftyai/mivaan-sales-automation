import { z } from "zod";

import {
  PartySource,
  PartyStatus,
} from "../../common/types/workflows-enums.js";
export const createPartySchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  legalName: z.string().trim().max(200).optional(),
  tradeName: z.string().trim().max(200).optional(),

  mobile: z.string().trim().min(8).max(20),
  email: z.string().email().optional(),

  source: z.nativeEnum(PartySource),

  customerType: z.string().trim().min(1),
  productCategory: z.string().trim().min(1),

  products: z.array(z.string().trim().min(1)).default([]),

  qtyApproxMt: z.number().nonnegative().optional(),

  area: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),

  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
      "Invalid GSTIN format"
    )
    .optional(),

  cin: z.string().trim().toUpperCase().optional(),

  assignedCamId: z.string().optional(),
  remarks: z.string().trim().max(3000).optional()
});

export const updatePartyStatusSchema = z.object({
  status: z.nativeEnum(PartyStatus),
  reason: z.string().trim().min(3)
});