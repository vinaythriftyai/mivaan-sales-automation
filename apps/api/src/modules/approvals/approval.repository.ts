import mongoose from "mongoose";

import { AppError } from "../../common/errors/app-errors.js";
import { UserRole } from "../../common/types/workflows-enums.js";

type ObjectIdLike = string | mongoose.Types.ObjectId;

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

type ApprovalListQuery = {
  status?: string;
  entityType?: string;
  approvalType?: string;
};

type CreatePendingApprovalInput = {
  tenantId: ObjectIdLike;
  entityType: string;
  entityId: ObjectIdLike;

  approvalType?: string;
  referenceType?: string;
  referenceId?: ObjectIdLike;

  title?: string;
  customerName?: string;
  onboardingNumber?: string;
  partyId?: ObjectIdLike;

  requestedBy: ObjectIdLike;
  approverRole?: string;
  approverId?: ObjectIdLike;

  metadata?: Record<string, unknown>;
};

function approvalCollection() {
  return mongoose.connection.collection("approvals");
}

function toObjectId(value: ObjectIdLike) {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  return new mongoose.Types.ObjectId(value);
}

function assertObjectId(value: string, message: string, code: string) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400, code);
  }
}

function removeUndefinedFields(record: Record<string, unknown>) {
  Object.keys(record).forEach((key) => {
    if (record[key] === undefined) {
      delete record[key];
    }
  });

  return record;
}

/**
 * Used by onboarding submit flow.
 * Keeps one pending approval per entity.
 */
export async function createPendingApproval(input: CreatePendingApprovalInput) {
  const now = new Date();

  const tenantId = toObjectId(input.tenantId);
  const entityId = toObjectId(input.entityId);

  const approvalType = input.approvalType ?? `${input.entityType}_APPROVAL`;

  const referenceType = input.referenceType ?? input.entityType;

  const referenceId = toObjectId(input.referenceId ?? input.entityId);

  const approvalDocument = removeUndefinedFields({
    tenantId,
    entityType: input.entityType,
    entityId,

    approvalType,
    referenceType,
    referenceId,

    title: input.title,
    customerName: input.customerName,
    onboardingNumber: input.onboardingNumber,

    partyId: input.partyId ? toObjectId(input.partyId) : undefined,

    requestedBy: toObjectId(input.requestedBy),
    requestedAt: now,

    approverRole: input.approverRole ?? UserRole.HOD,

    approverId: input.approverId ? toObjectId(input.approverId) : undefined,

    status: "PENDING",

    metadata: input.metadata ?? {},

    createdAt: now,
  });

  return approvalCollection().findOneAndUpdate(
    {
      tenantId,
      entityType: input.entityType,
      entityId,
      approvalType,
      status: "PENDING",
    },
    {
      $setOnInsert: approvalDocument,
      $set: {
        updatedAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );
}

export async function listPendingApprovals(
  tenantId: string,
  userId: string,
  role: string,
  includeAllTenantApprovals = false,
) {
  const filter: Record<string, unknown> = {
    tenantId: toObjectId(tenantId),
    status: "PENDING",
  };

  if (!includeAllTenantApprovals) {
    filter.$or = [
      {
        approverRole: role,
      },
      {
        approverId: toObjectId(userId),
      },
    ];
  }

  return approvalCollection()
    .find(filter)
    .sort({
      requestedAt: -1,
      createdAt: -1,
    })
    .toArray();
}

export async function listApprovals(
  currentUser: CurrentUser,
  query: ApprovalListQuery,
) {
  const filter: Record<string, unknown> = {
    tenantId: toObjectId(currentUser.tenantId),
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.entityType) {
    filter.entityType = query.entityType;
  }

  if (query.approvalType) {
    filter.approvalType = query.approvalType;
  }

  if (currentUser.role !== UserRole.SYSTEM_ADMIN) {
    filter.$or = [
      {
        approverRole: currentUser.role,
      },
      {
        approverId: toObjectId(currentUser.userId),
      },
      {
        requestedBy: toObjectId(currentUser.userId),
      },
      {
        decidedBy: toObjectId(currentUser.userId),
      },
    ];
  }

  return approvalCollection()
    .find(filter)
    .sort({
      requestedAt: -1,
      createdAt: -1,
    })
    .toArray();
}

export async function getApprovalById(
  approvalId: string,
  currentUser: CurrentUser,
) {
  assertObjectId(approvalId, "Invalid approval ID", "INVALID_APPROVAL_ID");

  const approval = await approvalCollection().findOne({
    _id: toObjectId(approvalId),
    tenantId: toObjectId(currentUser.tenantId),
  });

  if (!approval) {
    throw new AppError("Approval not found", 404, "APPROVAL_NOT_FOUND");
  }

  if (currentUser.role === UserRole.SYSTEM_ADMIN) {
    return approval;
  }

  const canView =
    approval.approverRole === currentUser.role ||
    approval.approverId?.toString() === currentUser.userId ||
    approval.requestedBy?.toString() === currentUser.userId ||
    approval.decidedBy?.toString() === currentUser.userId;

  if (!canView) {
    throw new AppError(
      "You are not allowed to view this approval",
      403,
      "APPROVAL_ACCESS_DENIED",
    );
  }

  return approval;
}
type ResolvePendingApprovalInput = {
  tenantId: ObjectIdLike;
  entityType: string;
  entityId: ObjectIdLike;
  approvalType?: string;
  status: "APPROVED" | "REJECTED";
  decidedBy: ObjectIdLike;
  comment?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Used by onboarding approve/reject flow.
 * Resolves the pending approval record for an entity.
 */
export async function resolvePendingApproval(
  ...args:
    | [ResolvePendingApprovalInput]
    | [
        ObjectIdLike,
        string,
        ObjectIdLike,
        "APPROVED" | "REJECTED",
        ObjectIdLike,
        string?,
      ]
) {
  const input =
    typeof args[0] === "object" &&
    !(args[0] instanceof mongoose.Types.ObjectId) &&
    "tenantId" in args[0]
      ? args[0]
      : {
          tenantId: args[0],
          entityType: args[1],
          entityId: args[2],
          status: args[3],
          decidedBy: args[4],
          comment: args[3] === "APPROVED" ? args[5] : undefined,
          reason: args[3] === "REJECTED" ? args[5] : undefined,
        };

  const now = new Date();

  const tenantId = toObjectId(input.tenantId);
  const entityId = toObjectId(input.entityId);

  const filter: Record<string, unknown> = {
    tenantId,
    entityType: input.entityType,
    entityId,
    status: "PENDING",
  };

  if (input.approvalType) {
    filter.approvalType = input.approvalType;
  }

  const update = removeUndefinedFields({
    status: input.status,
    decidedBy: toObjectId(input.decidedBy),
    decidedAt: now,
    comment: input.comment,
    reason: input.reason,
    metadata: input.metadata,
    updatedAt: now,
  });

  return approvalCollection().findOneAndUpdate(
    filter,
    {
      $set: update,
    },
    {
      returnDocument: "after",
    },
  );
}
