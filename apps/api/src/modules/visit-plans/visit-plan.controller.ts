import type { Request, Response } from "express";

//port { AppError } from "../../common/errors/app-error.js";
import { AppError } from "../../common/errors/app-errors.js";
import {
  approveVisitPlan,
  createVisitPlan,
  getVisitPlan,
  listVisitPlans,
  rejectVisitPlan,
  submitVisitPlan
} from "./visit-plan.service.js";

function requireUser(request: Request) {
  if (!request.user) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTH_REQUIRED"
    );
  }

  return request.user;
}

export async function createVisitPlanController(
  request: Request,
  response: Response
): Promise<void> {
  const plan = await createVisitPlan(
    request.body,
    requireUser(request)
  );

  response.status(201).json({
    success: true,
    data: plan
  });
}

export async function listVisitPlansController(
  request: Request,
  response: Response
): Promise<void> {
  const plans = await listVisitPlans(
    requireUser(request),
    request.query as Record<string, string | undefined>
  );

  response.status(200).json({
    success: true,
    data: plans
  });
}

export async function getVisitPlanController(
  request: Request,
  response: Response
): Promise<void> {
  const plan = await getVisitPlan(
    request.params.visitPlanId,
    requireUser(request)
  );

  response.status(200).json({
    success: true,
    data: plan
  });
}

export async function submitVisitPlanController(
  request: Request,
  response: Response
): Promise<void> {
  const result = await submitVisitPlan(
    request.params.visitPlanId,
    request.body.approverId,
    requireUser(request)
  );

  response.status(200).json({
    success: true,
    data: result
  });
}

export async function approveVisitPlanController(
  request: Request,
  response: Response
): Promise<void> {
  const plan = await approveVisitPlan(
    request.params.visitPlanId,
    requireUser(request)
  );

  response.status(200).json({
    success: true,
    data: plan
  });
}

export async function rejectVisitPlanController(
  request: Request,
  response: Response
): Promise<void> {
  const plan = await rejectVisitPlan(
    request.params.visitPlanId,
    request.body.reason,
    requireUser(request)
  );

  response.status(200).json({
    success: true,
    data: plan
  });
}