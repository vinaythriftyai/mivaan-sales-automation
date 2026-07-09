import { Router } from "express";
import { z } from "zod";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { validateBody } from "../../common/middleware/validate.js";
//port { UserRole } from "../../common/types/workflow-enums.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  approveVisitPlanController,
  createVisitPlanController,
  getVisitPlanController,
  listVisitPlansController,
  rejectVisitPlanController,
  submitVisitPlanController
} from "./visit-plan.controller.js";
import {
  createVisitPlanSchema,
  rejectVisitPlanSchema
} from "./visit-plan.validation.js";

const submitVisitPlanSchema = z.object({
  approverId: z.string().min(1)
});

export const visitPlanRouter = Router();

visitPlanRouter.use(authenticate);

visitPlanRouter.get(
  "/",
  asyncHandler(listVisitPlansController)
);

visitPlanRouter.post(
  "/",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(createVisitPlanSchema),
  asyncHandler(createVisitPlanController)
);

visitPlanRouter.get(
  "/:visitPlanId",
  asyncHandler(getVisitPlanController)
);

visitPlanRouter.post(
  "/:visitPlanId/submit",
  authorize(
    UserRole.CAM,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(submitVisitPlanSchema),
  asyncHandler(submitVisitPlanController)
);

visitPlanRouter.post(
  "/:visitPlanId/approve",
  authorize(
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN
  ),
  asyncHandler(approveVisitPlanController)
);

visitPlanRouter.post(
  "/:visitPlanId/reject",
  authorize(
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(rejectVisitPlanSchema),
  asyncHandler(rejectVisitPlanController)
);