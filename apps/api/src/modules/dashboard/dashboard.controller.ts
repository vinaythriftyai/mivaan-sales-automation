import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";

import { getDashboardSummary } from "./dashboard.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTH_REQUIRED",
    );
  }

  return request.user;
}

export async function getDashboardSummaryController(
  request: Request,
  response: Response,
): Promise<void> {
  const summary = await getDashboardSummary(
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: summary,
  });
}