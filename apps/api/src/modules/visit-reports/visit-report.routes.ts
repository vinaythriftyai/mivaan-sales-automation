import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { validateBody } from "../../common/middleware/validate.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  createVisitReportController,
  getPartyVisitReportsController,
  getVisitReportController
} from "./visit-report.controller.js";

import {
  createVisitReportSchema
} from "./visit-report.validation.js";

export const visitReportRouter = Router();

visitReportRouter.use(authenticate);

visitReportRouter.post(
  "/",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(createVisitReportSchema),
  asyncHandler(createVisitReportController)
);

visitReportRouter.get(
  "/party/:partyId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN
  ),
  asyncHandler(
    getPartyVisitReportsController
  )
);

visitReportRouter.get(
  "/:visitReportId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN
  ),
  asyncHandler(getVisitReportController)
);