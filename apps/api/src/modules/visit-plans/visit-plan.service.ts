//port { AppError } from "../../common/errors/app-error.js";
import { AppError } from "../../common/errors/app-errors.js";
import {
  ApprovalEntityType,
  ApprovalStatus,
  VisitPlanStatus
} from "../../common/types/workflows-enums.js"
import { ApprovalModel } from "../approvals/approval.model.js";
import { AuditEventModel } from "../audit/audit-event.model.js";
import { PartyModel } from "../parties/party.model.js";
import { VisitPlanModel } from "./visit-plan.model.js";
import { assertVisitPlanTransition } from "./visit-plan-transition.service.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

function createVisitPlanNumber(): string {
  return `VP-${new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14)}-${Math.floor(Math.random() * 1000)}`;
}

export async function createVisitPlan(
  input: Record<string, any>,
  currentUser: CurrentUser
) {
  const partyIds = input.items.map(
    (item: { partyId: string }) => item.partyId
  );

  const parties = await PartyModel.find({
    _id: { $in: partyIds },
    tenantId: currentUser.tenantId,
    isArchived: false
  }).lean();

  if (parties.length !== partyIds.length) {
    throw new AppError(
      "One or more selected parties do not exist",
      400,
      "INVALID_PARTY_SELECTION"
    );
  }

  const visitPlan = await VisitPlanModel.create({
    tenantId: currentUser.tenantId,
    planNumber: createVisitPlanNumber(),
    ...input,
    status: VisitPlanStatus.DRAFT,
    createdBy: currentUser.userId,
    updatedBy: currentUser.userId
  });

  await AuditEventModel.create({
    tenantId: currentUser.tenantId,
    entityType: "VISIT_PLAN",
    entityId: visitPlan._id,
    action: "VISIT_PLAN_CREATED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    newValue: visitPlan.toObject()
  });

  return visitPlan;
}

export async function listVisitPlans(
  currentUser: CurrentUser,
  query: Record<string, string | undefined>
) {
  const filter: Record<string, unknown> = {
    tenantId: currentUser.tenantId
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.camId) {
    filter.camId = query.camId;
  }

  return VisitPlanModel.find(filter)
    .populate("camId", "name email role")
    .populate("items.partyId", "companyName status area city")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getVisitPlan(
  visitPlanId: string,
  currentUser: CurrentUser
) {
  const plan = await VisitPlanModel.findOne({
    _id: visitPlanId,
    tenantId: currentUser.tenantId
  })
    .populate("camId", "name email role")
    .populate("items.partyId")
    .lean();

  if (!plan) {
    throw new AppError(
      "Visit Plan not found",
      404,
      "VISIT_PLAN_NOT_FOUND"
    );
  }

  return plan;
}

export async function submitVisitPlan(
  visitPlanId: string,
  approverId: string,
  currentUser: CurrentUser
) {
  const plan = await VisitPlanModel.findOne({
    _id: visitPlanId,
    tenantId: currentUser.tenantId
  });

  if (!plan) {
    throw new AppError(
      "Visit Plan not found",
      404,
      "VISIT_PLAN_NOT_FOUND"
    );
  }

  if (plan.camId.toString() !== currentUser.userId) {
    throw new AppError(
      "Only the assigned CAM can submit this Visit Plan",
      403,
      "VISIT_PLAN_OWNER_REQUIRED"
    );
  }

  assertVisitPlanTransition(
    plan.status as VisitPlanStatus,
    VisitPlanStatus.SUBMITTED
  );

  plan.status = VisitPlanStatus.SUBMITTED;
  plan.submittedAt = new Date();
  plan.updatedBy = currentUser.userId as never;

  await plan.save();

  const approval = await ApprovalModel.create({
    tenantId: currentUser.tenantId,
    entityType: ApprovalEntityType.VISIT_PLAN,
    entityId: plan._id,
    status: ApprovalStatus.PENDING,
    requestedBy: currentUser.userId,
    approverId,
    requestedAt: new Date()
  });

  await AuditEventModel.create({
    tenantId: currentUser.tenantId,
    entityType: "VISIT_PLAN",
    entityId: plan._id,
    action: "VISIT_PLAN_SUBMITTED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    newValue: {
      status: VisitPlanStatus.SUBMITTED,
      approvalId: approval._id
    }
  });

  return {
    visitPlan: plan,
    approval
  };
}

export async function approveVisitPlan(
  visitPlanId: string,
  currentUser: CurrentUser
) {
  const plan = await VisitPlanModel.findOne({
    _id: visitPlanId,
    tenantId: currentUser.tenantId
  });

  if (!plan) {
    throw new AppError(
      "Visit Plan not found",
      404,
      "VISIT_PLAN_NOT_FOUND"
    );
  }

  assertVisitPlanTransition(
    plan.status as VisitPlanStatus,
    VisitPlanStatus.APPROVED
  );

  const approval = await ApprovalModel.findOne({
    tenantId: currentUser.tenantId,
    entityType: ApprovalEntityType.VISIT_PLAN,
    entityId: plan._id,
    approverId: currentUser.userId,
    status: ApprovalStatus.PENDING
  });

  if (!approval) {
    throw new AppError(
      "Pending approval assignment not found",
      403,
      "APPROVAL_NOT_ASSIGNED"
    );
  }

  plan.status = VisitPlanStatus.APPROVED;
  plan.approvedAt = new Date();
  plan.approvedBy = currentUser.userId as never;
  plan.updatedBy = currentUser.userId as never;

  approval.status = ApprovalStatus.APPROVED;
  approval.decidedAt = new Date();

  await Promise.all([
    plan.save(),
    approval.save()
  ]);

  await AuditEventModel.create({
    tenantId: currentUser.tenantId,
    entityType: "VISIT_PLAN",
    entityId: plan._id,
    action: "VISIT_PLAN_APPROVED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    newValue: {
      status: VisitPlanStatus.APPROVED
    }
  });

  return plan;
}

export async function rejectVisitPlan(
  visitPlanId: string,
  reason: string,
  currentUser: CurrentUser
) {
  const plan = await VisitPlanModel.findOne({
    _id: visitPlanId,
    tenantId: currentUser.tenantId
  });

  if (!plan) {
    throw new AppError(
      "Visit Plan not found",
      404,
      "VISIT_PLAN_NOT_FOUND"
    );
  }

  assertVisitPlanTransition(
    plan.status as VisitPlanStatus,
    VisitPlanStatus.REJECTED
  );

  const approval = await ApprovalModel.findOne({
    tenantId: currentUser.tenantId,
    entityType: ApprovalEntityType.VISIT_PLAN,
    entityId: plan._id,
    approverId: currentUser.userId,
    status: ApprovalStatus.PENDING
  });

  if (!approval) {
    throw new AppError(
      "Pending approval assignment not found",
      403,
      "APPROVAL_NOT_ASSIGNED"
    );
  }

  plan.status = VisitPlanStatus.REJECTED;
  plan.rejectedAt = new Date();
  plan.rejectedBy = currentUser.userId as never;
  plan.rejectionReason = reason;
  plan.updatedBy = currentUser.userId as never;

  approval.status = ApprovalStatus.REJECTED;
  approval.decidedAt = new Date();
  approval.decisionReason = reason;

  await Promise.all([
    plan.save(),
    approval.save()
  ]);

  await AuditEventModel.create({
    tenantId: currentUser.tenantId,
    entityType: "VISIT_PLAN",
    entityId: plan._id,
    action: "VISIT_PLAN_REJECTED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    newValue: {
      status: VisitPlanStatus.REJECTED,
      reason
    }
  });

  return plan;
}