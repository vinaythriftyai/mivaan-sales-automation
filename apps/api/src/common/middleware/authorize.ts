import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-errors.js";
import { UserRole } from "../types/workflows-enums.js";

// import { AppError } from "../errors/app-error.js";
// import type { UserRole } from "../types/workflow-enums.js";

export function authorize(...allowedRoles: UserRole[]) {
  return (
    request: Request,
    _response: Response,
    next: NextFunction
  ): void => {
    if (!request.user) {
      return next(
        new AppError("Authentication required", 401, "AUTH_REQUIRED")
      );
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
}