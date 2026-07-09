// import type { Request, Response } from "express";

// //import { AppError } from "../../common/errors/app-error.js";
// import { AppError } from "../../common/errors/app-errors.js";
// import { getCurrentUser, loginUser } from "./auth.service.js";

// export async function loginController(
//   request: Request,
//   response: Response
// ): Promise<void> {
//   const result = await loginUser(request.body);

//   response.status(200).json({
//     success: true,
//     data: result
//   });
// }

// export async function meController(
//   request: Request,
//   response: Response
// ): Promise<void> {
//   if (!request.user) {
//     throw new AppError(
//       "Authentication required",
//       401,
//       "AUTH_REQUIRED"
//     );
//   }

//   const user = await getCurrentUser(request.user.userId);

//   response.status(200).json({
//     success: true,
//     data: user
//   });
// }

import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-errors.js";

import { getCurrentUser, loginUser, signupUser } from "./auth.service.js";

export async function signupController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await signupUser(request.body);

  response.status(201).json({
    success: true,
    data: result,
  });
}

export async function loginController(
  request: Request,
  response: Response,
): Promise<void> {
  const result = await loginUser(request.body);

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function meController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  const user = await getCurrentUser(request.user.userId);

  response.status(200).json({
    success: true,
    data: user,
  });
}
