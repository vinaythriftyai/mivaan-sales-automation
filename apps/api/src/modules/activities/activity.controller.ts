import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";
import {
  completeFollowUp,
  createManualActivity,
  listPartyActivities,
  reopenFollowUp,
} from "./activity.service.js";
import {
 
} from "./activity.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

export async function createActivityController(
  request: Request,
  response: Response,
): Promise<void> {
  const activity = await createManualActivity(
    request.body,
    requireCurrentUser(request),
  );

  response.status(201).json({
    success: true,
    data: activity,
  });
}

export async function listPartyActivitiesController(
  request: Request,
  response: Response,
): Promise<void> {
  const activities = await listPartyActivities(
    request.params.partyId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: activities,
  });
}
export async function completeFollowUpController(
  request: Request,
  response: Response,
): Promise<void> {
  const activity = await completeFollowUp(
    request.params.activityId,
    request.body,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: activity,
  });
}

export async function reopenFollowUpController(
  request: Request,
  response: Response,
): Promise<void> {
  const activity = await reopenFollowUp(
    request.params.activityId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: activity,
  });
}
