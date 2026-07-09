import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";
import { UserRole } from "../../common/types/workflows-enums.js";

import {
  getApprovalById,
  listApprovals,
  listPendingApprovals,
} from "./approval.repository.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

export async function listMyPendingApprovalsController(
  request: Request,
  response: Response,
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const includeAllTenantApprovals =
    currentUser.role === UserRole.SYSTEM_ADMIN;

  const approvals = await listPendingApprovals(
    currentUser.tenantId,
    currentUser.userId,
    currentUser.role,
    includeAllTenantApprovals,
  );

  response.status(200).json({
    success: true,
    data: approvals,
  });
}

export async function listApprovalsController(
  request: Request,
  response: Response,
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const status =
    typeof request.query.status === "string"
      ? request.query.status
      : undefined;

  const entityType =
    typeof request.query.entityType === "string"
      ? request.query.entityType
      : undefined;

  const approvalType =
    typeof request.query.approvalType === "string"
      ? request.query.approvalType
      : undefined;

  const approvals = await listApprovals(currentUser, {
    status,
    entityType,
    approvalType,
  });

  response.status(200).json({
    success: true,
    data: approvals,
  });
}

export async function getApprovalController(
  request: Request,
  response: Response,
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const approval = await getApprovalById(
    request.params.approvalId,
    currentUser,
  );

  response.status(200).json({
    success: true,
    data: approval,
  });
}