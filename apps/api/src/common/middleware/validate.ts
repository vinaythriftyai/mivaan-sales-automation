import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-errors.js";
export function validateBody(schema: ZodType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body);

    if (!parsed.success) {
      return next(
        new AppError(
          "Request validation failed",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten()
        )
      );
    }

    request.body = parsed.data;
    next();
  };
}