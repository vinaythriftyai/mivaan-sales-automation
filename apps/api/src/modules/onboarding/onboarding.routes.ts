import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { validateBody } from "../../common/middleware/validate.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  approveOnboardingController,
  getOnboardingController,
  listOnboardingController,
  rejectOnboardingController,
  runOcrController,
  selectAddressController,
  submitOnboardingController,
  syncOnboardingErpController,
  uploadDocumentController,
  verifyGstController,
} from "./onboarding.controller.js";

import { onboardingDocumentUpload } from "./onboarding-upload.middleware.js";

import {
  approveOnboardingSchema,
  rejectOnboardingSchema,
} from "./onboarding-actions.validation.js";

import {
  selectOnboardingAddressSchema,
  uploadOnboardingDocumentSchema,
} from "./onboarding.validation.js";

export const onboardingRouter = Router();

onboardingRouter.use(authenticate);

const onboardingReadRoles = authorize(
  UserRole.CAM,
  UserRole.SALES,
  UserRole.ACCOUNTS,
  UserRole.HOD,
  UserRole.SYSTEM_ADMIN,
);

const onboardingPreparationRoles = authorize(
  UserRole.CAM,
  UserRole.SALES,
  UserRole.ACCOUNTS,
  UserRole.SYSTEM_ADMIN,
);

const onboardingSubmitRoles = authorize(
  UserRole.CAM,
  UserRole.SALES,
  UserRole.SYSTEM_ADMIN,
);

const onboardingApprovalRoles = authorize(
  UserRole.HOD,
  UserRole.SYSTEM_ADMIN,
);

/**
 * List onboardings
 */
onboardingRouter.get(
  "/",
  onboardingReadRoles,
  asyncHandler(listOnboardingController),
);

/**
 * Upload GST / Trade Declaration document
 */
onboardingRouter.post(
  "/:onboardingId/documents",
  onboardingPreparationRoles,
  onboardingDocumentUpload.single("file"),
  validateBody(uploadOnboardingDocumentSchema),
  asyncHandler(uploadDocumentController),
);

/**
 * Run mock OCR
 */
onboardingRouter.post(
  "/:onboardingId/run-ocr",
  onboardingPreparationRoles,
  asyncHandler(runOcrController),
);

/**
 * Run mock GST verification
 */
onboardingRouter.post(
  "/:onboardingId/verify-gst",
  onboardingPreparationRoles,
  asyncHandler(verifyGstController),
);

/**
 * Select customer-master address
 */
onboardingRouter.post(
  "/:onboardingId/select-address",
  onboardingPreparationRoles,
  validateBody(selectOnboardingAddressSchema),
  asyncHandler(selectAddressController),
);

/**
 * Submit onboarding for HOD approval
 */
onboardingRouter.post(
  "/:onboardingId/submit",
  onboardingSubmitRoles,
  asyncHandler(submitOnboardingController),
);

/**
 * HOD approve onboarding
 */
onboardingRouter.post(
  "/:onboardingId/approve",
  onboardingApprovalRoles,
  validateBody(approveOnboardingSchema),
  asyncHandler(approveOnboardingController),
);

/**
 * HOD reject onboarding
 */
onboardingRouter.post(
  "/:onboardingId/reject",
  onboardingApprovalRoles,
  validateBody(rejectOnboardingSchema),
  asyncHandler(rejectOnboardingController),
);

/**
 * HOD sync approved onboarding to ERP / BC-365
 */
onboardingRouter.post(
  "/:onboardingId/sync-erp",
  onboardingApprovalRoles,
  asyncHandler(syncOnboardingErpController),
);

/**
 * Keep the generic ID route last.
 */
onboardingRouter.get(
  "/:onboardingId",
  onboardingReadRoles,
  asyncHandler(getOnboardingController),
);