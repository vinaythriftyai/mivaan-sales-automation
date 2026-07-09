import { connection, Types } from "mongoose";


import { AppError } from "../../common/errors/app-errors.js";
type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

function toObjectId(value: string) {
  return new Types.ObjectId(value);
}

function assertObjectId(
  value: string,
  message: string,
  code: string,
) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400, code);
  }
}

function approvalCollection() {
  return connection.collection("approvals");
}

export async function listMyPendingApprovals(
  currentUser: CurrentUser,
) {
  const filter: Record<string, unknown> = {
    tenantId: toObjectId(currentUser.tenantId),
    status: "PENDING",
  };

  if (currentUser.role !== "SYSTEM_ADMIN") {
    filter.approverRole = currentUser.role;
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
  query: {
    status?: string;
    entityType?: string;
    approvalType?: string;
  },
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

  if (currentUser.role !== "SYSTEM_ADMIN") {
    filter.$or = [
      {
        approverRole: currentUser.role,
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
  assertObjectId(
    approvalId,
    "Invalid approval ID",
    "INVALID_APPROVAL_ID",
  );

  const approval = await approvalCollection().findOne({
    _id: toObjectId(approvalId),
    tenantId: toObjectId(currentUser.tenantId),
  });

  if (!approval) {
    throw new AppError(
      "Approval not found",
      404,
      "APPROVAL_NOT_FOUND",
    );
  }

  if (
    currentUser.role !== "SYSTEM_ADMIN" &&
    approval.approverRole !== currentUser.role &&
    approval.requestedBy?.toString() !== currentUser.userId &&
    approval.decidedBy?.toString() !== currentUser.userId
  ) {
    throw new AppError(
      "You are not allowed to view this approval",
      403,
      "APPROVAL_ACCESS_DENIED",
    );
  }

  return approval;
}