import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { validateBody } from "../../common/middleware/validate.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  completeFollowUpController,
  reopenFollowUpController,
} from "./activity.controller.js";

import {
  completeFollowUpSchema,
  createActivitySchema,
} from "./activity.validation.js";
import {
  createActivityController,
  listPartyActivitiesController,
} from "./activity.controller.js";

export const activityRouter = Router();

activityRouter.use(authenticate);

activityRouter.post(
  "/",
  authorize(UserRole.CAM, UserRole.SALES, UserRole.SYSTEM_ADMIN),
  validateBody(createActivitySchema),
  asyncHandler(createActivityController),
);
activityRouter.patch(
  "/:activityId/complete-follow-up",
  authorize(UserRole.CAM, UserRole.SALES, UserRole.SYSTEM_ADMIN),
  validateBody(completeFollowUpSchema),
  asyncHandler(completeFollowUpController),
);

activityRouter.patch(
  "/:activityId/reopen-follow-up",
  authorize(UserRole.CAM, UserRole.SALES, UserRole.SYSTEM_ADMIN),
  asyncHandler(reopenFollowUpController),
);
activityRouter.get(
  "/party/:partyId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(listPartyActivitiesController),
);
