import { Types } from "mongoose";

import { AppError } from "../../common/errors/app-errors.js";

import {
  ActivityType,
  PartyStatus,
  VisitPlanStatus,
  VisitReportStatus,
} from "../../common/types/workflows-enums.js";
import { ActivityModel } from "../activities/activity.model.js";
import { AuditEventModel } from "../audit/audit-event.model.js";
import { PartyModel } from "../parties/party.model.js";
import { VisitPlanModel } from "../visit-plans/visit-plan.model.js";
import { VisitReportModel } from "./visit-report.model.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

type CreateVisitReportInput = {
  visitPlanId: string;
  visitPlanItemId: string;
  partyId: string;
  camId: string;

  visitedAt: Date;
  contactPerson?: string;

  customerType: string;
  productCategory: string;
  products: string[];

  qtyApproxMt?: number;
  productFit: boolean;

  seriousness: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

  expectedDemand?: string;
  outcomeSummary: string;
  remarks?: string;

  lastFollowUpAt?: Date;
  nextFollowUpAt?: Date;
};

export async function createVisitReport(
  input: CreateVisitReportInput,
  currentUser: CurrentUser,
) {
  const visitPlan = await VisitPlanModel.findOne({
    _id: input.visitPlanId,
    tenantId: currentUser.tenantId,
  });

  if (!visitPlan) {
    throw new AppError("Visit Plan not found", 404, "VISIT_PLAN_NOT_FOUND");
  }

  if (visitPlan.status !== VisitPlanStatus.APPROVED) {
    throw new AppError(
      "Visit Report can only be submitted for an approved Visit Plan",
      409,
      "VISIT_PLAN_NOT_APPROVED",
    );
  }

  if (visitPlan.camId.toString() !== currentUser.userId) {
    throw new AppError(
      "Only the assigned CAM can submit this Visit Report",
      403,
      "VISIT_PLAN_OWNER_REQUIRED",
    );
  }

  const planItem = visitPlan.items.id(input.visitPlanItemId);

  if (!planItem) {
    throw new AppError(
      "Visit Plan item not found",
      404,
      "VISIT_PLAN_ITEM_NOT_FOUND",
    );
  }

  if (planItem.partyId.toString() !== input.partyId) {
    throw new AppError(
      "The selected party does not belong to this Visit Plan item",
      409,
      "VISIT_PLAN_PARTY_MISMATCH",
    );
  }

  const party = await PartyModel.findOne({
    _id: input.partyId,
    tenantId: currentUser.tenantId,
    isArchived: false,
  });

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  const existingReport = await VisitReportModel.findOne({
    tenantId: currentUser.tenantId,
    visitPlanId: input.visitPlanId,
    visitPlanItemId: input.visitPlanItemId,
  }).lean();

  if (existingReport) {
    throw new AppError(
      "A Visit Report already exists for this Visit Plan item",
      409,
      "VISIT_REPORT_ALREADY_EXISTS",
      {
        visitReportId: existingReport._id,
      },
    );
  }

  const visitReport = await VisitReportModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    visitPlanId: new Types.ObjectId(input.visitPlanId),

    visitPlanItemId: new Types.ObjectId(input.visitPlanItemId),

    partyId: new Types.ObjectId(input.partyId),

    camId: new Types.ObjectId(currentUser.userId),

    visitedAt: input.visitedAt,
    contactPerson: input.contactPerson,

    customerType: input.customerType,
    productCategory: input.productCategory,
    products: input.products,

    qtyApproxMt: input.qtyApproxMt,
    productFit: input.productFit,
    seriousness: input.seriousness,

    expectedDemand: input.expectedDemand,
    outcomeSummary: input.outcomeSummary,
    remarks: input.remarks,

    lastFollowUpAt: input.lastFollowUpAt,
    nextFollowUpAt: input.nextFollowUpAt,

    status: VisitReportStatus.SUBMITTED,
    submittedAt: new Date(),

    createdBy: new Types.ObjectId(currentUser.userId),

    updatedBy: new Types.ObjectId(currentUser.userId),
  });

  party.status = PartyStatus.VISITED;

  if (input.customerType) {
    party.customerType = input.customerType;
  }

  if (input.productCategory) {
    party.productCategory = input.productCategory;
  }

  if (input.products.length > 0) {
    party.products = input.products;
  }

  if (input.qtyApproxMt !== undefined) {
    party.qtyApproxMt = input.qtyApproxMt;
  }

  if (input.lastFollowUpAt) {
    party.lastFollowUpAt = input.lastFollowUpAt;
  }

  if (input.nextFollowUpAt) {
    party.nextFollowUpAt = input.nextFollowUpAt;
  }

  party.updatedBy = new Types.ObjectId(currentUser.userId);

  await party.save();

  await ActivityModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    partyId: new Types.ObjectId(input.partyId),

    type: ActivityType.VISIT,

    activityAt: input.visitedAt,

    summary: input.outcomeSummary,

    outcome: input.remarks,

    nextFollowUpAt: input.nextFollowUpAt,

    visitReportId: visitReport._id,

    createdBy: new Types.ObjectId(currentUser.userId),
  });

  await AuditEventModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    entityType: "VISIT_REPORT",
    entityId: visitReport._id,

    action: "VISIT_REPORT_SUBMITTED",

    actorId: new Types.ObjectId(currentUser.userId),

    actorRole: currentUser.role,

    newValue: visitReport.toObject(),

    metadata: {
      visitPlanId: input.visitPlanId,
      visitPlanItemId: input.visitPlanItemId,
      partyId: input.partyId,
    },
  });

  await AuditEventModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    entityType: "PARTY",
    entityId: party._id,

    action: "PARTY_MARKED_VISITED",

    actorId: new Types.ObjectId(currentUser.userId),

    actorRole: currentUser.role,

    newValue: {
      status: PartyStatus.VISITED,
      lastFollowUpAt: party.lastFollowUpAt,
      nextFollowUpAt: party.nextFollowUpAt,
    },

    metadata: {
      visitReportId: visitReport._id,
    },
  });

  return visitReport;
}

export async function getVisitReport(
  visitReportId: string,
  currentUser: CurrentUser,
) {
  const visitReport = await VisitReportModel.findOne({
    _id: visitReportId,
    tenantId: currentUser.tenantId,
  })
    .populate("partyId", "companyName mobile email status")
    .lean();

  if (!visitReport) {
    throw new AppError("Visit Report not found", 404, "VISIT_REPORT_NOT_FOUND");
  }

  return visitReport;
}

export async function getPartyVisitReports(
  partyId: string,
  currentUser: CurrentUser,
) {
  return VisitReportModel.find({
    tenantId: currentUser.tenantId,
    partyId,
  })
    .sort({
      visitedAt: -1,
    })
    .lean();
}
