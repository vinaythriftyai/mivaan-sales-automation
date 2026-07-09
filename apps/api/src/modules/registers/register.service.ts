import mongoose from "mongoose";

import { ActivityModel } from "../activities/activity.model.js";
import { OnboardingRequestModel } from "../onboarding/onboarding.model.js";
import { PartyModel } from "../parties/party.model.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

export async function listPotentialCustomers(currentUser: CurrentUser) {
  return PartyModel.find({
    tenantId: toObjectId(currentUser.tenantId),
    isArchived: false,
    status: {
      $in: ["POTENTIAL", "HIGH_POTENTIAL"],
    },
  })
    .sort({
      updatedAt: -1,
      createdAt: -1,
    })
    .lean();
}

export async function listExistingCustomers(currentUser: CurrentUser) {
  return PartyModel.find({
    tenantId: toObjectId(currentUser.tenantId),
    isArchived: false,
    status: "CUSTOMER",
  })
    .sort({
      updatedAt: -1,
      createdAt: -1,
    })
    .lean();
}

export async function listMcaCustomers(currentUser: CurrentUser) {
  return OnboardingRequestModel.find({
    tenantId: toObjectId(currentUser.tenantId),
    status: "CUSTOMER_CREATED",
  })
    .populate(
      "partyId",
      "companyName mobile email status gstin customerType productCategory qtyApproxMt",
    )
    .sort({
      updatedAt: -1,
      createdAt: -1,
    })
    .lean();
}

export async function listActivityRegister(currentUser: CurrentUser) {
  return ActivityModel.find({
    tenantId: toObjectId(currentUser.tenantId),
  })
    .populate("partyId", "companyName mobile status")
    .sort({
      activityAt: -1,
      createdAt: -1,
    })
    .limit(200)
    .lean();
}

export async function listFollowUpRegister(currentUser: CurrentUser) {
  return ActivityModel.find({
    tenantId: toObjectId(currentUser.tenantId),
    nextFollowUpAt: {
      $exists: true,
      $ne: null,
    },
  })
    .populate("partyId", "companyName mobile status")
    .sort({
      nextFollowUpAt: 1,
      activityAt: -1,
    })
    .limit(200)
    .lean();
}