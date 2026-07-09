import type {
  Request,
  Response
} from "express";

import { AppError } from "../../common/errors/app-errors.js";
import {
  createVisitReport,
  getPartyVisitReports,
  getVisitReport
} from "./visit-report.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTH_REQUIRED"
    );
  }

  return request.user;
}

export async function createVisitReportController(
  request: Request,
  response: Response
): Promise<void> {
  const report = await createVisitReport(
    request.body,
    requireCurrentUser(request)
  );

  response.status(201).json({
    success: true,
    data: report
  });
}

export async function getVisitReportController(
  request: Request,
  response: Response
): Promise<void> {
  const report = await getVisitReport(
    request.params.visitReportId,
    requireCurrentUser(request)
  );

  response.status(200).json({
    success: true,
    data: report
  });
}

export async function getPartyVisitReportsController(
  request: Request,
  response: Response
): Promise<void> {
  const reports = await getPartyVisitReports(
    request.params.partyId,
    requireCurrentUser(request)
  );

  response.status(200).json({
    success: true,
    data: reports
  });
}