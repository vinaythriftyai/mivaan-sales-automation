import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";
import {
  approveOnboarding,
  rejectOnboarding,
  submitOnboardingForApproval,
  syncOnboardingToErp,
} from "./onboarding-actions.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

export async function submitOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const onboarding = await submitOnboardingForApproval(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: onboarding,
  });
}

export async function approveOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const onboarding = await approveOnboarding(
    request.params.onboardingId,
    request.body,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: onboarding,
  });
}

export async function rejectOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const onboarding = await rejectOnboarding(
    request.params.onboardingId,
    request.body,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: onboarding,
  });
}

export async function syncOnboardingErpController(
  request: Request,
  response: Response,
): Promise<void> {
  const onboarding = await syncOnboardingToErp(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: onboarding,
  });
}
