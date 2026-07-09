import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorize } from "../../common/middleware/authorize.js";
import { validateBody } from "../../common/middleware/validate.js";
//port { UserRole } from "../../common/types/workflow-enums.js";
import { UserRole } from "../../common/types/workflows-enums.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  createPartyController,
  getPartyController,
  listPartiesController,
  updatePartyController,
} from "./party.controller.js";
import { createPartySchema } from "./party.validation.js";
import {
  convertPartyController,
  markHighPotentialController,
  markNotInterestedController,
  markPotentialController,
} from "./party-actions.controller.js";

import { partyDecisionSchema } from "./party-actions.validation.js";
export const partyRouter = Router();

partyRouter.use(authenticate);

partyRouter.get(
  "/",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.IT_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(listPartiesController),
);

partyRouter.post(
  "/",
  authorize(UserRole.CAM, UserRole.SALES, UserRole.SYSTEM_ADMIN),
  validateBody(createPartySchema),
  asyncHandler(createPartyController),
);

partyRouter.get(
  "/:partyId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.HOD,
    UserRole.IT_ADMIN,
    UserRole.SYSTEM_ADMIN,
  ),
  asyncHandler(getPartyController),
);

partyRouter.patch(
  "/:partyId",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.ACCOUNTS,
    UserRole.SYSTEM_ADMIN,
  ),
  
  asyncHandler(updatePartyController),
);
partyRouter.post(
  "/:partyId/mark-potential",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(partyDecisionSchema),
  asyncHandler(markPotentialController)
);

partyRouter.post(
  "/:partyId/mark-high-potential",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(partyDecisionSchema),
  asyncHandler(
    markHighPotentialController
  )
);

partyRouter.post(
  "/:partyId/mark-not-interested",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(partyDecisionSchema),
  asyncHandler(
    markNotInterestedController
  )
);

partyRouter.post(
  "/:partyId/convert",
  authorize(
    UserRole.CAM,
    UserRole.SALES,
    UserRole.SYSTEM_ADMIN
  ),
  validateBody(partyDecisionSchema),
  asyncHandler(convertPartyController)
);