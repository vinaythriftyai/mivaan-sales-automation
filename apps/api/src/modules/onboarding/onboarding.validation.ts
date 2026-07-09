import { z } from "zod";

export const uploadOnboardingDocumentSchema =
  z.object({
    type: z.enum([
      "GST_CERTIFICATE",
      "TRADE_DECLARATION"
    ])
  });

export const selectOnboardingAddressSchema =
  z.object({
    addressId: z
      .string()
      .regex(
        /^[a-fA-F0-9]{24}$/,
        "Invalid address ID"
      )
  });

export const rejectOnboardingSchema =
  z.object({
    reason: z
      .string()
      .trim()
      .min(
        5,
        "Rejection reason must contain at least 5 characters"
      )
      .max(2000)
  });