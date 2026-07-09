import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";

import {
  listAuditEvents,
  listEntityTimeline,
} from "./audit.repository.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

export async function listAuditEventsController(
  request: Request,
  response: Response,
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const entityType =
    typeof request.query.entityType === "string"
      ? request.query.entityType
      : undefined;

  const entityId =
    typeof request.query.entityId === "string"
      ? request.query.entityId
      : undefined;

  const actorId =
    typeof request.query.actorId === "string"
      ? request.query.actorId
      : undefined;

  const action =
    typeof request.query.action === "string"
      ? request.query.action
      : undefined;

  const limit =
    typeof request.query.limit === "string"
      ? Number(request.query.limit)
      : undefined;

  const events = await listAuditEvents({
    tenantId: currentUser.tenantId,
    entityType,
    entityId,
    actorId,
    action,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  response.status(200).json({
    success: true,
    data: events,
  });
}

export async function listEntityTimelineController(
  request: Request,
  response: Response,
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const events = await listEntityTimeline(
    currentUser.tenantId,
    request.params.entityType,
    request.params.entityId,
  );

  response.status(200).json({
    success: true,
    data: events,
  });
}