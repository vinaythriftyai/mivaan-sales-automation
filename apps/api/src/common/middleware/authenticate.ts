import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
// import { AppError } from "../errors/app-error.js";
// import type { UserRole } from "../types/workflow-enums.js";
import type { UserRole } from "../types/workflows-enums.js";
import { AppError } from "../errors/app-errors.js";
type AccessTokenPayload = {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
};

export function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction
): void {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(
      new AppError("Authentication required", 401, "AUTH_REQUIRED")
    );
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    ) as AccessTokenPayload;

    request.user = payload;
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
  }
}