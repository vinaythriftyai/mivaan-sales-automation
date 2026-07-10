import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";
import { getStoredUploadPath } from "./onboarding-upload.middleware.js";

import {
  getOnboardingRequest,
  listOnboardingRequests,
  runMockGstVerification,
  runMockOnboardingOcr,
  selectOnboardingAddress,
  approveOnboardingRequest,
  rejectOnboardingRequest,
  submitOnboardingForApproval,
  syncOnboardingToMockErp,
  uploadOnboardingDocument,
} from "./onboarding.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

export async function listOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const status =
    typeof request.query.status === "string" ? request.query.status : undefined;

  const records = await listOnboardingRequests(
    requireCurrentUser(request),
    status,
  );

  response.status(200).json({
    success: true,
    data: records,
  });
}

export async function getOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await getOnboardingRequest(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}

export async function uploadDocumentController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.file) {
    throw new AppError(
      "A document file is required",
      400,
      "ONBOARDING_DOCUMENT_REQUIRED",
    );
  }

  const record = await uploadOnboardingDocument(
    request.params.onboardingId,

    {
      type: request.body.type,

      originalName: request.file.originalname,

      storagePath: getStoredUploadPath(request.file.path),

      mimeType: request.file.mimetype,

      sizeBytes: request.file.size,
    },

    requireCurrentUser(request),
  );

  response.status(201).json({
    success: true,
    data: record,
  });
}

export async function runOcrController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await runMockOnboardingOcr(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}

export async function verifyGstController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await runMockGstVerification(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}

export async function selectAddressController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await selectOnboardingAddress(
    request.params.onboardingId,
    request.body.addressId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}
export async function submitOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await submitOnboardingForApproval(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}

export async function approveOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await approveOnboardingRequest(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}

export async function rejectOnboardingController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await rejectOnboardingRequest(
    request.params.onboardingId,
    request.body.reason,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}

export async function syncOnboardingErpController(
  request: Request,
  response: Response,
): Promise<void> {
  const record = await syncOnboardingToMockErp(
    request.params.onboardingId,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: record,
  });
}
