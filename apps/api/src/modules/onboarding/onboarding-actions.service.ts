import { connection, Types } from "mongoose";

import { AppError } from "../../common/errors/app-errors.js";
import {
  OnboardingStatus,
  PartyStatus,
} from "../../common/types/workflows-enums.js";
import { AuditEventModel } from "../audit/audit-event.model.js";

import { PartyModel } from "../parties/party.model.js";

import { OnboardingRequestModel } from "./onboarding.model.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

type ApproveInput = {
  comment?: string;
};

type RejectInput = {
  reason: string;
};

function assertObjectId(value: string, message: string, code: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400, code);
  }
}

function buildCustomerCode(partyId: string): string {
  return `CUST-${partyId.slice(-6).toUpperCase()}`;
}

async function writeAuditEvent(params: {
  tenantId: string;
  entityId: Types.ObjectId;
  action: string;
  actorId: string;
  actorRole: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}) {
  await AuditEventModel.create({
    tenantId: new Types.ObjectId(params.tenantId),

    entityType: "ONBOARDING",

    entityId: params.entityId,

    action: params.action,

    actorId: new Types.ObjectId(params.actorId),

    actorRole: params.actorRole,

    oldValue: params.oldValue,

    newValue: params.newValue,

    metadata: params.metadata ?? {},
  });
}

async function createApprovalRecord(onboarding: any, currentUser: CurrentUser) {
  await connection.collection("approvals").updateOne(
    {
      tenantId: new Types.ObjectId(currentUser.tenantId),
      entityType: "ONBOARDING",
      entityId: onboarding._id,
      status: "PENDING",
    },
    {
      $setOnInsert: {
        tenantId: new Types.ObjectId(currentUser.tenantId),

        entityType: "ONBOARDING",
        entityId: onboarding._id,

        approvalType: "ONBOARDING_APPROVAL",

        referenceType: "ONBOARDING",
        referenceId: onboarding._id,

        title: `Onboarding approval - ${onboarding.customerName}`,

        customerName: onboarding.customerName,

        onboardingNumber: onboarding.onboardingNumber,

        partyId: onboarding.partyId,

        requestedBy: new Types.ObjectId(currentUser.userId),

        requestedAt: new Date(),

        approverRole: "HOD",

        status: "PENDING",

        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    {
      upsert: true,
    },
  );
}

async function closeApprovalRecord(params: {
  tenantId: string;
  onboardingId: Types.ObjectId;
  status: "APPROVED" | "REJECTED";
  actorId: string;
  comment?: string;
  reason?: string;
}) {
  await connection.collection("approvals").updateMany(
    {
      tenantId: new Types.ObjectId(params.tenantId),
      entityType: "ONBOARDING",
      entityId: params.onboardingId,
      status: "PENDING",
    },
    {
      $set: {
        status: params.status,
        decidedBy: new Types.ObjectId(params.actorId),
        decidedAt: new Date(),
        comment: params.comment,
        reason: params.reason,
        updatedAt: new Date(),
      },
    },
  );
}

function validateReadyForSubmission(onboarding: any) {
  const hasGstCertificate = onboarding.documents?.some(
    (document: any) => document.type === "GST_CERTIFICATE",
  );

  if (!hasGstCertificate) {
    throw new AppError(
      "GST certificate is required before submitting onboarding",
      409,
      "GST_CERTIFICATE_REQUIRED",
    );
  }

  if (!onboarding.extractedData) {
    throw new AppError(
      "OCR extraction must be completed before submitting onboarding",
      409,
      "OCR_REQUIRED",
    );
  }

  if (
    onboarding.gstVerification?.status !== "VERIFIED_ACTIVE" ||
    onboarding.gstVerification?.isActive !== true
  ) {
    throw new AppError(
      "GST verification must be active and verified before submitting onboarding",
      409,
      "GST_VERIFICATION_REQUIRED",
    );
  }

  if (!onboarding.selectedAddressId) {
    throw new AppError(
      "Customer-master address must be selected before submitting onboarding",
      409,
      "ADDRESS_SELECTION_REQUIRED",
    );
  }

  const selectedAddressId = onboarding.selectedAddressId.toString();

  const selectedAddressExists = onboarding.addresses?.some(
    (address: any) => address._id?.toString() === selectedAddressId,
  );

  if (!selectedAddressExists) {
    throw new AppError(
      "Selected address is invalid",
      409,
      "INVALID_SELECTED_ADDRESS",
    );
  }
}

export async function submitOnboardingForApproval(
  onboardingId: string,
  currentUser: CurrentUser,
) {
  assertObjectId(
    onboardingId,
    "Invalid onboarding ID",
    "INVALID_ONBOARDING_ID",
  );

  const onboarding = await OnboardingRequestModel.findOne({
    _id: onboardingId,
    tenantId: currentUser.tenantId,
  });

  if (!onboarding) {
    throw new AppError(
      "Onboarding request not found",
      404,
      "ONBOARDING_NOT_FOUND",
    );
  }

  if (onboarding.status !== OnboardingStatus.READY_FOR_REVIEW) {
    throw new AppError(
      `Onboarding cannot be submitted from ${onboarding.status}`,
      409,
      "INVALID_ONBOARDING_STATUS_TRANSITION",
      {
        currentStatus: onboarding.status,
        requiredStatus: OnboardingStatus.READY_FOR_REVIEW,
      },
    );
  }

  validateReadyForSubmission(onboarding);

  const oldValue = {
    status: onboarding.status,
  };

  onboarding.status = OnboardingStatus.PENDING_APPROVAL;

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await createApprovalRecord(onboarding, currentUser);

  await writeAuditEvent({
    tenantId: currentUser.tenantId,
    entityId: onboarding._id,
    action: "ONBOARDING_SUBMITTED_FOR_APPROVAL",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    oldValue,
    newValue: {
      status: onboarding.status,
    },
    metadata: {
      onboardingNumber: onboarding.onboardingNumber,
      partyId: onboarding.partyId,
    },
  });

  return onboarding;
}

export async function approveOnboarding(
  onboardingId: string,
  input: ApproveInput,
  currentUser: CurrentUser,
) {
  assertObjectId(
    onboardingId,
    "Invalid onboarding ID",
    "INVALID_ONBOARDING_ID",
  );

  const onboarding = await OnboardingRequestModel.findOne({
    _id: onboardingId,
    tenantId: currentUser.tenantId,
  });

  if (!onboarding) {
    throw new AppError(
      "Onboarding request not found",
      404,
      "ONBOARDING_NOT_FOUND",
    );
  }

  if (onboarding.status !== OnboardingStatus.PENDING_APPROVAL) {
    throw new AppError(
      `Onboarding cannot be approved from ${onboarding.status}`,
      409,
      "INVALID_ONBOARDING_STATUS_TRANSITION",
      {
        currentStatus: onboarding.status,
        requiredStatus: OnboardingStatus.PENDING_APPROVAL,
      },
    );
  }

  const oldValue = {
    status: onboarding.status,
  };

  onboarding.status = OnboardingStatus.APPROVED;

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await closeApprovalRecord({
    tenantId: currentUser.tenantId,
    onboardingId: onboarding._id,
    status: "APPROVED",
    actorId: currentUser.userId,
    comment: input.comment,
  });

  await writeAuditEvent({
    tenantId: currentUser.tenantId,
    entityId: onboarding._id,
    action: "ONBOARDING_APPROVED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    oldValue,
    newValue: {
      status: onboarding.status,
    },
    metadata: {
      comment: input.comment,
      onboardingNumber: onboarding.onboardingNumber,
      partyId: onboarding.partyId,
    },
  });

  return onboarding;
}

export async function rejectOnboarding(
  onboardingId: string,
  input: RejectInput,
  currentUser: CurrentUser,
) {
  assertObjectId(
    onboardingId,
    "Invalid onboarding ID",
    "INVALID_ONBOARDING_ID",
  );

  const onboarding = await OnboardingRequestModel.findOne({
    _id: onboardingId,
    tenantId: currentUser.tenantId,
  });

  if (!onboarding) {
    throw new AppError(
      "Onboarding request not found",
      404,
      "ONBOARDING_NOT_FOUND",
    );
  }

  if (onboarding.status !== OnboardingStatus.PENDING_APPROVAL) {
    throw new AppError(
      `Onboarding cannot be rejected from ${onboarding.status}`,
      409,
      "INVALID_ONBOARDING_STATUS_TRANSITION",
      {
        currentStatus: onboarding.status,
        requiredStatus: OnboardingStatus.PENDING_APPROVAL,
      },
    );
  }

  const oldValue = {
    status: onboarding.status,
  };

  onboarding.status = OnboardingStatus.REJECTED;
  onboarding.rejectionReason = input.reason;

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await closeApprovalRecord({
    tenantId: currentUser.tenantId,
    onboardingId: onboarding._id,
    status: "REJECTED",
    actorId: currentUser.userId,
    reason: input.reason,
  });

  await writeAuditEvent({
    tenantId: currentUser.tenantId,
    entityId: onboarding._id,
    action: "ONBOARDING_REJECTED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    oldValue,
    newValue: {
      status: onboarding.status,
      rejectionReason: onboarding.rejectionReason,
    },
    metadata: {
      reason: input.reason,
      onboardingNumber: onboarding.onboardingNumber,
      partyId: onboarding.partyId,
    },
  });

  return onboarding;
}

export async function syncOnboardingToErp(
  onboardingId: string,
  currentUser: CurrentUser,
) {
  assertObjectId(
    onboardingId,
    "Invalid onboarding ID",
    "INVALID_ONBOARDING_ID",
  );

  const onboarding = await OnboardingRequestModel.findOne({
    _id: onboardingId,
    tenantId: currentUser.tenantId,
  });

  if (!onboarding) {
    throw new AppError(
      "Onboarding request not found",
      404,
      "ONBOARDING_NOT_FOUND",
    );
  }

  if (onboarding.status === OnboardingStatus.CUSTOMER_CREATED) {
    throw new AppError(
      "Customer has already been created",
      409,
      "CUSTOMER_ALREADY_CREATED",
      {
        customerCode: onboarding.erpSync?.customerCode,
      },
    );
  }

  if (onboarding.status !== OnboardingStatus.APPROVED) {
    throw new AppError(
      `ERP sync can only be done after onboarding approval`,
      409,
      "ONBOARDING_NOT_APPROVED",
      {
        currentStatus: onboarding.status,
        requiredStatus: OnboardingStatus.APPROVED,
      },
    );
  }

  const party = await PartyModel.findOne({
    _id: onboarding.partyId,
    tenantId: currentUser.tenantId,
    isArchived: false,
  });

  if (!party) {
    throw new AppError("Linked party not found", 404, "PARTY_NOT_FOUND");
  }

  const oldOnboardingValue = {
    status: onboarding.status,
    erpSync: onboarding.erpSync,
  };

  onboarding.status = OnboardingStatus.CUSTOMER_CREATED;

  onboarding.erpSync = {
    status: "SUCCESS",
    attemptCount: (onboarding.erpSync?.attemptCount ?? 0) + 1,
    customerCode: buildCustomerCode(party._id.toString()),
    lastAttemptAt: new Date(),
  };

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  const oldPartyValue = {
    status: party.status,
  };

  party.status = PartyStatus.CUSTOMER;

  party.updatedBy = new Types.ObjectId(currentUser.userId);

  await party.save();

  await writeAuditEvent({
    tenantId: currentUser.tenantId,
    entityId: onboarding._id,
    action: "ERP_SYNC_SUCCESS",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    oldValue: oldOnboardingValue,
    newValue: {
      status: onboarding.status,
      erpSync: onboarding.erpSync,
    },
    metadata: {
      customerCode: onboarding.erpSync.customerCode,
      partyId: party._id,
    },
  });

  await AuditEventModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    entityType: "PARTY",

    entityId: party._id,

    action: "PARTY_MARKED_CUSTOMER",

    actorId: new Types.ObjectId(currentUser.userId),

    actorRole: currentUser.role,

    oldValue: oldPartyValue,

    newValue: {
      status: party.status,
    },

    metadata: {
      onboardingId: onboarding._id,
      customerCode: onboarding.erpSync.customerCode,
    },
  });

  return onboarding;
}
