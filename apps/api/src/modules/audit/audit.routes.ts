import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  listAuditEventsController,
  listEntityTimelineController,
} from "./audit.controller.js";

export const auditRouter = Router();

auditRouter.use(authenticate);

auditRouter.get(
  "/",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(listAuditEventsController),
);

auditRouter.get(
  "/entity/:entityType/:entityId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(listEntityTimelineController),
);