import mongoose from "mongoose";

import { ActivityModel } from "../activities/activity.model.js";
import { OnboardingRequestModel } from "../onboarding/onboarding.model.js";
import { PartyModel } from "../parties/party.model.js";
import { VisitPlanModel } from "../visit-plans/visit-plan.model.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function approvalCollection() {
  return mongoose.connection.collection("approvals");
}

export async function getDashboardSummary(
  currentUser: CurrentUser,
) {
  const tenantId = toObjectId(currentUser.tenantId);

  const [
    totalLeads,
    visitedParties,
    potentialCustomers,
    highPotentialCustomers,
    convertedCustomers,
    customersCreated,

    pendingVisitPlans,
    approvedVisitPlans,
    rejectedVisitPlans,

    onboardingDrafts,
    readyForReviewOnboardings,
    pendingOnboardingApprovals,
    approvedOnboardings,
    customerCreatedOnboardings,

    pendingApprovalRecords,
    recentActivities,
  ] = await Promise.all([
    PartyModel.countDocuments({
      tenantId,
      isArchived: false,
      status: "LEAD",
    }),

    PartyModel.countDocuments({
      tenantId,
      isArchived: false,
      status: "VISITED",
    }),

    PartyModel.countDocuments({
      tenantId,
      isArchived: false,
      status: "POTENTIAL",
    }),

    PartyModel.countDocuments({
      tenantId,
      isArchived: false,
      status: "HIGH_POTENTIAL",
    }),

    PartyModel.countDocuments({
      tenantId,
      isArchived: false,
      status: "CONVERTED",
    }),

    PartyModel.countDocuments({
      tenantId,
      isArchived: false,
      status: "CUSTOMER",
    }),

    VisitPlanModel.countDocuments({
      tenantId,
      status: "SUBMITTED",
    }),

    VisitPlanModel.countDocuments({
      tenantId,
      status: "APPROVED",
    }),

    VisitPlanModel.countDocuments({
      tenantId,
      status: "REJECTED",
    }),

    OnboardingRequestModel.countDocuments({
      tenantId,
      status: "DRAFT",
    }),

    OnboardingRequestModel.countDocuments({
      tenantId,
      status: "READY_FOR_REVIEW",
    }),

    OnboardingRequestModel.countDocuments({
      tenantId,
      status: "PENDING_APPROVAL",
    }),

    OnboardingRequestModel.countDocuments({
      tenantId,
      status: "APPROVED",
    }),

    OnboardingRequestModel.countDocuments({
      tenantId,
      status: "CUSTOMER_CREATED",
    }),

    approvalCollection().countDocuments({
      tenantId,
      status: "PENDING",
    }),

    ActivityModel.find({
      tenantId,
    })
      .sort({
        activityAt: -1,
        createdAt: -1,
      })
      .limit(8)
      .lean(),
  ]);

  return {
    leadFunnel: {
      totalLeads,
      visitedParties,
      potentialCustomers,
      highPotentialCustomers,
      convertedCustomers,
      customersCreated,
    },

    visitPlans: {
      pendingApproval: pendingVisitPlans,
      approved: approvedVisitPlans,
      rejected: rejectedVisitPlans,
    },

    onboarding: {
      drafts: onboardingDrafts,
      readyForReview: readyForReviewOnboardings,
      pendingApproval: pendingOnboardingApprovals,
      approved: approvedOnboardings,
      customerCreated: customerCreatedOnboardings,
    },

    approvals: {
      pending: pendingApprovalRecords,
    },

    recentActivities,
  };
}