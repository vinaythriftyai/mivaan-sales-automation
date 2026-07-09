import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  getApprovalController,
  listApprovalsController,
  listMyPendingApprovalsController,
} from "./approval.controller.js";

export const approvalRouter = Router();

approvalRouter.use(authenticate);

approvalRouter.get(
  "/my-pending",
  authorize(UserRole.HOD, UserRole.SYSTEM_ADMIN),
  asyncHandler(listMyPendingApprovalsController),
);

approvalRouter.get(
  "/",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(listApprovalsController),
);

approvalRouter.get(
  "/:approvalId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(getApprovalController),
);