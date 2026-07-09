import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  listActivityRegisterController,
  listExistingCustomersController,
  listFollowUpRegisterController,
  listMcaCustomersController,
  listPotentialCustomersController,
} from "./register.controller.js";

export const registerRouter = Router();

registerRouter.use(authenticate);

const registerReadRoles = authorize(
  UserRole.CAM,
  UserRole.SALES,
  UserRole.ACCOUNTS,
  UserRole.HOD,
  UserRole.SYSTEM_ADMIN,
);

registerRouter.get(
  "/potential-customers",
  registerReadRoles,
  asyncHandler(listPotentialCustomersController),
);

registerRouter.get(
  "/existing-customers",
  registerReadRoles,
  asyncHandler(listExistingCustomersController),
);

registerRouter.get(
  "/mca-customers",
  registerReadRoles,
  asyncHandler(listMcaCustomersController),
);

registerRouter.get(
  "/activities",
  registerReadRoles,
  asyncHandler(listActivityRegisterController),
);

registerRouter.get(
  "/follow-ups",
  registerReadRoles,
  asyncHandler(listFollowUpRegisterController),
);