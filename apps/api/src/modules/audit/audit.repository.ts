import mongoose from "mongoose";

import { AppError } from "../../common/errors/app-errors.js";

type AuditListQuery = {
  tenantId: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
};

function auditCollection() {
  return mongoose.connection.collection("auditevents");
}

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function assertObjectId(value: string, message: string, code: string) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400, code);
  }
}

export async function listAuditEvents(query: AuditListQuery) {
  const filter: Record<string, unknown> = {
    tenantId: toObjectId(query.tenantId),
  };

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.entityId) {
    assertObjectId(query.entityId, "Invalid entity ID", "INVALID_ENTITY_ID");
    filter.entityId = toObjectId(query.entityId);
  }

  if (query.actorId) {
    assertObjectId(query.actorId, "Invalid actor ID", "INVALID_ACTOR_ID");
    filter.actorId = toObjectId(query.actorId);
  }

  if (query.action) {
    filter.action = query.action;
  }

  const limit = Math.min(query.limit ?? 50, 200);

  return auditCollection()
    .find(filter)
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .limit(limit)
    .toArray();
}

export async function listEntityTimeline(
  tenantId: string,
  entityType: string,
  entityId: string,
) {
  assertObjectId(entityId, "Invalid entity ID", "INVALID_ENTITY_ID");

  return auditCollection()
    .find({
      tenantId: toObjectId(tenantId),
      entityType,
      entityId: toObjectId(entityId),
    })
    .sort({
      createdAt: 1,
      _id: 1,
    })
    .toArray();
}