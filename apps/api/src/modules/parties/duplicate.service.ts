import { PartyModel } from "./party.model.js";

type DuplicateCheckInput = {
  tenantId: string;
  gstin?: string;
  mobile?: string;
  email?: string;
  companyName: string;
};

export async function checkPartyDuplicates(input: DuplicateCheckInput) {
  const exactGstin = input.gstin
    ? await PartyModel.findOne({
        tenantId: input.tenantId,
        gstin: input.gstin
      }).lean()
    : null;

  const exactMobile = input.mobile
    ? await PartyModel.findOne({
        tenantId: input.tenantId,
        mobile: input.mobile
      }).lean()
    : null;

  const exactEmail = input.email
    ? await PartyModel.findOne({
        tenantId: input.tenantId,
        email: input.email.toLowerCase()
      }).lean()
    : null;

  const similarNames = await PartyModel.find({
    tenantId: input.tenantId,
    companyName: {
      $regex: input.companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i"
    }
  })
    .limit(10)
    .lean();

  return {
    exactGstin,
    warnings: {
      exactMobile,
      exactEmail,
      similarNames
    }
  };
}
// Rules:

// Exact GSTIN: block creation.
// Existing mobile/email: warn and show existing record.
// Similar company name: warn for manual confirmation.
// Do not automatically merge records.