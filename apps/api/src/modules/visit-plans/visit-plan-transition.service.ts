import { AppError } from "../../common/errors/app-errors.js";
import { VisitPlanStatus } from "../../common/types/workflows-enums.js";

const allowedTransitions: Record<VisitPlanStatus, VisitPlanStatus[]> = {
  [VisitPlanStatus.DRAFT]: [
    VisitPlanStatus.SUBMITTED,
    VisitPlanStatus.CANCELLED,
  ],

  [VisitPlanStatus.SUBMITTED]: [
    VisitPlanStatus.APPROVED,
    VisitPlanStatus.REJECTED,
    VisitPlanStatus.CANCELLED,
  ],

  [VisitPlanStatus.APPROVED]: [
    VisitPlanStatus.COMPLETED,
    VisitPlanStatus.CANCELLED,
  ],

  [VisitPlanStatus.REJECTED]: [
    VisitPlanStatus.DRAFT,
    VisitPlanStatus.CANCELLED,
  ],

  [VisitPlanStatus.COMPLETED]: [],

  [VisitPlanStatus.CANCELLED]: [],
};

export function assertVisitPlanTransition(
  current: VisitPlanStatus,
  target: VisitPlanStatus,
): void {
  if (!allowedTransitions[current].includes(target)) {
    throw new AppError(
      `Visit Plan cannot move from ${current} to ${target}`,
      409,
      "INVALID_VISIT_PLAN_TRANSITION",
    );
  }
}
// Important backend rules:

// Only the owner CAM can edit a draft.
// A submitted plan cannot be edited.
// Rejected plans can return to draft.
// Only HOD can approve or reject.
// Rejection requires a reason.
// A Visit Report cannot be submitted against an unapproved plan.