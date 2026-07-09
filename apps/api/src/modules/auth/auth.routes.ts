import { Router } from "express";

import { authenticate } from "../../common/middleware/authenticate.js";
import { validateBody } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";

import {
  loginController,
  meController,
  signupController
} from "./auth.controller.js";

import {
  loginSchema,
  signupSchema
} from "./auth.validation.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  validateBody(signupSchema),
  asyncHandler(signupController)
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(loginController)
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(meController)
);
authRouter.get("/test", (_request, response) => {
  response.json({
    success: true,
    message: "Auth router is working"
  });
});