import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  getDashboardSummaryController,
} from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get(
  "/summary",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(getDashboardSummaryController),
);