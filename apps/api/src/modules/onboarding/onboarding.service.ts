import mongoose from "mongoose";
import { AppError } from "../../common/errors/app-errors.js";
import {
  OnboardingStatus,
  PartyStatus,
  UserRole,
} from "../../common/types/workflows-enums.js";

import { env } from "../../config/env.js";

import { AuditEventModel } from "../audit/audit-event.model.js";
import { PartyModel } from "../parties/party.model.js";

import { OnboardingRequestModel } from "./onboarding.model.js";
import {
  createPendingApproval,
  resolvePendingApproval
} from "../approvals/approval.repository.js";

import {
  UserModel
} from "../users/user.model.js";
const { Types } = mongoose;

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
  email?: string;
};

type UploadedDocumentInput = {
  type: "GST_CERTIFICATE" | "TRADE_DECLARATION";

  originalName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

async function findOnboardingDocument(
  onboardingId: string,
  currentUser: CurrentUser,
) {
  if (!Types.ObjectId.isValid(onboardingId)) {
    throw new AppError("Invalid onboarding ID", 400, "INVALID_ONBOARDING_ID");
  }

  const onboarding = await OnboardingRequestModel.findOne({
    _id: onboardingId,

    tenantId: new Types.ObjectId(currentUser.tenantId),
  });

  if (!onboarding) {
    throw new AppError(
      "Onboarding request not found",
      404,
      "ONBOARDING_NOT_FOUND",
    );
  }

  return onboarding;
}

async function writeOnboardingAudit(
  onboardingId: mongoose.Types.ObjectId,
  action: string,
  currentUser: CurrentUser,
  newValue?: unknown,
  metadata?: unknown,
): Promise<void> {
  await AuditEventModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    entityType: "ONBOARDING",
    entityId: onboardingId,
    action,

    actorId: new Types.ObjectId(currentUser.userId),

    actorRole: currentUser.role,

    newValue,
    metadata,
  });
}

export async function listOnboardingRequests(
  currentUser: CurrentUser,
  status?: string,
) {
  const filter: Record<string, unknown> = {
    tenantId: new Types.ObjectId(currentUser.tenantId),
  };

  if (status) {
    filter.status = status;
  }

  return OnboardingRequestModel.find(filter)
    .populate("partyId", "companyName mobile email status gstin")
    .sort({
      createdAt: -1,
    })
    .lean();
}

export async function getOnboardingRequest(
  onboardingId: string,
  currentUser: CurrentUser,
) {
  const onboarding = await findOnboardingDocument(onboardingId, currentUser);

  await onboarding.populate(
    "partyId",
    "companyName mobile email status gstin address area city",
  );

  return onboarding.toObject();
}

export async function uploadOnboardingDocument(
  onboardingId: string,
  input: UploadedDocumentInput,
  currentUser: CurrentUser,
) {
  const onboarding = await findOnboardingDocument(onboardingId, currentUser);

  if (
    onboarding.status !== OnboardingStatus.DRAFT &&
    onboarding.status !== OnboardingStatus.GST_VERIFICATION_PENDING &&
    onboarding.status !== OnboardingStatus.READY_FOR_REVIEW
  ) {
    throw new AppError(
      "Documents cannot be uploaded at the current onboarding stage",
      409,
      "ONBOARDING_DOCUMENT_UPLOAD_NOT_ALLOWED",
    );
  }

  const existingDocuments = onboarding.documents ?? [];

  /*
    Only one active document of each type is retained.
    Uploading another GST certificate replaces the
    previous GST certificate metadata.
  */
  const remainingDocuments = existingDocuments.filter(
    (document) => document.type !== input.type,
  );

  onboarding.set("documents", [
    ...remainingDocuments,
    {
      ...input,
      uploadedAt: new Date(),
    },
  ]);

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_DOCUMENT_UPLOADED",
    currentUser,
    {
      type: input.type,
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
  );

  return onboarding;
}

export async function runMockOnboardingOcr(
  onboardingId: string,
  currentUser: CurrentUser,
) {
  if (env.OCR_PROVIDER !== "mock") {
    throw new AppError(
      "A real OCR provider has not been configured",
      501,
      "OCR_PROVIDER_NOT_IMPLEMENTED",
    );
  }

  const onboarding = await findOnboardingDocument(onboardingId, currentUser);

  const gstCertificate = onboarding.documents.find(
    (document) => document.type === "GST_CERTIFICATE",
  );

  if (!gstCertificate) {
    throw new AppError(
      "Upload a GST Certificate before running OCR",
      409,
      "GST_CERTIFICATE_REQUIRED",
    );
  }

  const party = await PartyModel.findOne({
    _id: onboarding.partyId,

    tenantId: new Types.ObjectId(currentUser.tenantId),
  });

  if (!party) {
    throw new AppError("Associated party not found", 404, "PARTY_NOT_FOUND");
  }

  /*
    This is deterministic mock data for local
    development. No actual document OCR occurs.
  */
  const extractedGstin = onboarding.gstin || party.gstin || "27ABCDE1234F1Z5";

  const extractedPan =
    extractedGstin.length >= 12 ? extractedGstin.slice(2, 12) : undefined;

  const registeredAddress = {
    label: "Registered Address",

    line1: party.address || party.area || "Industrial Area",

    line2: party.area || undefined,
    city: party.city || "Nashik",
    state: "Maharashtra",
    pinCode: "422010",
    source: "MOCK_OCR",
  };

  onboarding.gstin = extractedGstin;

  onboarding.set("extractedData", {
    legalName: party.legalName || onboarding.customerName,

    tradeName: party.tradeName || onboarding.customerName,

    gstin: extractedGstin,
    pan: extractedPan,

    registrationStatus: "ACTIVE",

    addresses: [registeredAddress],

    confidence: 0.96,
  });

  /*
    Mongoose gives embedded subdocuments their own
    ObjectIds by default. The frontend later sends
    one of these IDs as selectedAddressId.
  */
  onboarding.set("addresses", [registeredAddress]);

  onboarding.status = OnboardingStatus.GST_VERIFICATION_PENDING;

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_OCR_COMPLETED",
    currentUser,
    {
      extractedData: onboarding.extractedData,

      provider: "mock",
    },
  );

  return onboarding;
}

export async function runMockGstVerification(
  onboardingId: string,
  currentUser: CurrentUser,
) {
  if (env.GST_PROVIDER !== "mock") {
    throw new AppError(
      "A real GST verification provider has not been configured",
      501,
      "GST_PROVIDER_NOT_IMPLEMENTED",
    );
  }

  const onboarding = await findOnboardingDocument(onboardingId, currentUser);

  const extractedGstin = onboarding.extractedData?.gstin;

  if (!extractedGstin) {
    throw new AppError(
      "Run OCR before GST verification",
      409,
      "OCR_REQUIRED_BEFORE_GST_VERIFICATION",
    );
  }

  const onboardingGstin = onboarding.gstin?.toUpperCase();

  const normalizedExtractedGstin = extractedGstin.toUpperCase();

  const mismatchReasons: string[] = [];

  if (onboardingGstin && onboardingGstin !== normalizedExtractedGstin) {
    mismatchReasons.push("Entered GSTIN does not match the GST Certificate");
  }

  const hasMismatch = mismatchReasons.length > 0;

  onboarding.set("gstVerification", {
    status: hasMismatch ? "MISMATCH" : "VERIFIED_ACTIVE",

    isActive: !hasMismatch,

    portalLegalName: onboarding.extractedData?.legalName,

    verifiedAt: new Date(),

    mismatchReasons,
  });

  onboarding.set("verifiedData", {
    legalName: onboarding.extractedData?.legalName,

    tradeName: onboarding.extractedData?.tradeName,

    gstin: normalizedExtractedGstin,

    pan: onboarding.extractedData?.pan,
  });

  onboarding.status = hasMismatch
    ? OnboardingStatus.GST_VERIFICATION_PENDING
    : OnboardingStatus.READY_FOR_REVIEW;

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_GST_VERIFIED",
    currentUser,
    {
      gstVerification: onboarding.gstVerification,

      provider: "mock",
    },
  );

  return onboarding;
}

export async function selectOnboardingAddress(
  onboardingId: string,
  addressId: string,
  currentUser: CurrentUser,
) {
  if (!Types.ObjectId.isValid(addressId)) {
    throw new AppError("Invalid address ID", 400, "INVALID_ADDRESS_ID");
  }

  const onboarding = await findOnboardingDocument(onboardingId, currentUser);

  const addressExists = onboarding.addresses.some(
    (address) => address._id?.toString() === addressId,
  );

  if (!addressExists) {
    throw new AppError(
      "Selected address does not belong to this onboarding request",
      404,
      "ONBOARDING_ADDRESS_NOT_FOUND",
    );
  }

  onboarding.selectedAddressId = new Types.ObjectId(addressId);

  onboarding.updatedBy = new Types.ObjectId(currentUser.userId);

  await onboarding.save();

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_ADDRESS_SELECTED",
    currentUser,
    {
      selectedAddressId: onboarding.selectedAddressId,
    },
  );

  return onboarding;
}
function buildErpCustomerCode(
  onboardingId: string
): string {
  const now = new Date();

  const year = String(
    now.getFullYear()
  ).slice(-2);

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const recordPart = onboardingId
    .slice(-6)
    .toUpperCase();

  return `CUS-${year}${month}-${recordPart}`;
}

export async function submitOnboardingForApproval(
  onboardingId: string,
  currentUser: CurrentUser
) {
  const onboarding =
    await findOnboardingDocument(
      onboardingId,
      currentUser
    );

  if (
    onboarding.status !==
    OnboardingStatus.READY_FOR_REVIEW
  ) {
    throw new AppError(
      "Only an onboarding request ready for review can be submitted",
      409,
      "ONBOARDING_NOT_READY_FOR_SUBMISSION"
    );
  }

  const gstCertificate =
    onboarding.documents.find(
      (document) =>
        document.type ===
        "GST_CERTIFICATE"
    );

  if (!gstCertificate) {
    throw new AppError(
      "GST Certificate is required",
      409,
      "GST_CERTIFICATE_REQUIRED"
    );
  }

  if (
    onboarding.gstVerification?.status !==
      "VERIFIED_ACTIVE" ||
    onboarding.gstVerification?.isActive !==
      true
  ) {
    throw new AppError(
      "Active GST verification is required before submission",
      409,
      "ACTIVE_GST_VERIFICATION_REQUIRED"
    );
  }

  if (!onboarding.selectedAddressId) {
    throw new AppError(
      "Select the customer-master address before submission",
      409,
      "ONBOARDING_ADDRESS_SELECTION_REQUIRED"
    );
  }

  const hodUser = await UserModel.findOne({
    tenantId: new Types.ObjectId(
      currentUser.tenantId
    ),

    role: UserRole.HOD
  })
    .sort({
      createdAt: 1
    })
    .lean();

  if (!hodUser) {
    throw new AppError(
      "No HOD user is available for approval",
      409,
      "ONBOARDING_HOD_NOT_FOUND"
    );
  }

  const now = new Date();

  onboarding.status =
    OnboardingStatus.PENDING_APPROVAL;

  onboarding.submittedAt = now;

  onboarding.submittedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  onboarding.approverId = hodUser._id;

  onboarding.rejectionReason = undefined;

  onboarding.updatedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  await onboarding.save();

  try {
    await createPendingApproval({
      tenantId: currentUser.tenantId,
      entityType: "ONBOARDING",
      entityId: onboarding._id,
      requestedBy: currentUser.userId,
      approverId: hodUser._id.toString()
    });
  } catch (error) {
    onboarding.status =
      OnboardingStatus.READY_FOR_REVIEW;

    onboarding.submittedAt = undefined;
    onboarding.submittedBy = undefined;
    onboarding.approverId = undefined;

    await onboarding.save();

    throw error;
  }

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_SUBMITTED_FOR_APPROVAL",
    currentUser,
    {
      status:
        OnboardingStatus.PENDING_APPROVAL,

      approverId: hodUser._id,

      submittedAt: now
    }
  );

  return onboarding;
}

export async function approveOnboardingRequest(
  onboardingId: string,
  currentUser: CurrentUser
) {
  const onboarding =
    await findOnboardingDocument(
      onboardingId,
      currentUser
    );

  if (
    onboarding.status !==
    OnboardingStatus.PENDING_APPROVAL
  ) {
    throw new AppError(
      "Only a pending onboarding request can be approved",
      409,
      "ONBOARDING_NOT_PENDING_APPROVAL"
    );
  }

  const isSystemAdmin =
    currentUser.role ===
    UserRole.SYSTEM_ADMIN;

  const isAssignedApprover =
    onboarding.approverId?.toString() ===
    currentUser.userId;

  if (
    !isSystemAdmin &&
    !isAssignedApprover
  ) {
    throw new AppError(
      "This onboarding request is assigned to another approver",
      403,
      "ONBOARDING_APPROVER_REQUIRED"
    );
  }

  const now = new Date();

  onboarding.status =
    OnboardingStatus.APPROVED;

  onboarding.approvedAt = now;

  onboarding.approvedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  onboarding.rejectedAt = undefined;
  onboarding.rejectedBy = undefined;
  onboarding.rejectionReason = undefined;

  onboarding.set("erpSync", {
    ...(onboarding.erpSync?.toObject?.() ??
      onboarding.erpSync),

    status: "NOT_READY",

    attemptCount:
      onboarding.erpSync?.attemptCount ?? 0
  });

  onboarding.updatedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  await onboarding.save();

  await resolvePendingApproval({
    tenantId: currentUser.tenantId,
    entityType: "ONBOARDING",
    entityId: onboarding._id,
    status: "APPROVED",
    decidedBy: currentUser.userId
  });

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_APPROVED",
    currentUser,
    {
      status: OnboardingStatus.APPROVED,
      approvedAt: now,
      approvedBy:
        currentUser.userId
    }
  );

  return onboarding;
}

export async function rejectOnboardingRequest(
  onboardingId: string,
  reason: string,
  currentUser: CurrentUser
) {
  const onboarding =
    await findOnboardingDocument(
      onboardingId,
      currentUser
    );

  if (
    onboarding.status !==
    OnboardingStatus.PENDING_APPROVAL
  ) {
    throw new AppError(
      "Only a pending onboarding request can be rejected",
      409,
      "ONBOARDING_NOT_PENDING_APPROVAL"
    );
  }

  const isSystemAdmin =
    currentUser.role ===
    UserRole.SYSTEM_ADMIN;

  const isAssignedApprover =
    onboarding.approverId?.toString() ===
    currentUser.userId;

  if (
    !isSystemAdmin &&
    !isAssignedApprover
  ) {
    throw new AppError(
      "This onboarding request is assigned to another approver",
      403,
      "ONBOARDING_APPROVER_REQUIRED"
    );
  }

  const now = new Date();

  onboarding.status =
    OnboardingStatus.REJECTED;

  onboarding.rejectedAt = now;

  onboarding.rejectedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  onboarding.rejectionReason =
    reason.trim();

  onboarding.updatedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  await onboarding.save();

  await resolvePendingApproval({
    tenantId: currentUser.tenantId,
    entityType: "ONBOARDING",
    entityId: onboarding._id,
    status: "REJECTED",
    decisionReason: reason.trim(),
    decidedBy: currentUser.userId
  });

  await writeOnboardingAudit(
    onboarding._id,
    "ONBOARDING_REJECTED",
    currentUser,
    {
      status: OnboardingStatus.REJECTED,
      rejectedAt: now,
      reason: reason.trim()
    }
  );

  return onboarding;
}

export async function syncOnboardingToMockErp(
  onboardingId: string,
  currentUser: CurrentUser
) {
  if (env.ERP_PROVIDER !== "mock") {
    throw new AppError(
      "A real ERP provider has not been configured",
      501,
      "ERP_PROVIDER_NOT_IMPLEMENTED"
    );
  }

  const onboarding =
    await findOnboardingDocument(
      onboardingId,
      currentUser
    );

  if (
    onboarding.status ===
    OnboardingStatus.CUSTOMER_CREATED
  ) {
    return onboarding;
  }

  if (
    onboarding.status !==
      OnboardingStatus.APPROVED &&
    onboarding.status !==
      OnboardingStatus.SYNC_FAILED
  ) {
    throw new AppError(
      "Only an approved onboarding request can be synchronized",
      409,
      "ONBOARDING_NOT_APPROVED_FOR_ERP"
    );
  }

  const currentAttemptCount =
    onboarding.erpSync?.attemptCount ?? 0;

  onboarding.status =
    OnboardingStatus.ERP_SYNC_PENDING;

  onboarding.set("erpSync", {
    status: "PENDING",

    attemptCount:
      currentAttemptCount + 1,

    lastAttemptAt: new Date(),

    customerCode:
      onboarding.erpSync?.customerCode,

    lastError: undefined
  });

  onboarding.updatedBy =
    new Types.ObjectId(
      currentUser.userId
    );

  await onboarding.save();

  try {
    const party = await PartyModel.findOne({
      _id: onboarding.partyId,

      tenantId: new Types.ObjectId(
        currentUser.tenantId
      )
    });

    if (!party) {
      throw new Error(
        "Associated party was not found"
      );
    }

    const customerCode =
      onboarding.erpSync?.customerCode ||
      buildErpCustomerCode(
        onboarding._id.toString()
      );

    party.status = PartyStatus.CUSTOMER;

    party.erpCustomerCode =
      customerCode;

    party.updatedBy =
      new Types.ObjectId(
        currentUser.userId
      );

    await party.save();

    onboarding.status =
      OnboardingStatus.CUSTOMER_CREATED;

    onboarding.set("erpSync", {
      status: "SUCCESS",

      attemptCount:
        currentAttemptCount + 1,

      customerCode,

      lastAttemptAt: new Date(),

      lastError: undefined
    });

    onboarding.updatedBy =
      new Types.ObjectId(
        currentUser.userId
      );

    await onboarding.save();

    await writeOnboardingAudit(
      onboarding._id,
      "ONBOARDING_ERP_SYNC_COMPLETED",
      currentUser,
      {
        provider: "mock",
        customerCode,
        status:
          OnboardingStatus.CUSTOMER_CREATED
      }
    );

    await AuditEventModel.create({
      tenantId: new Types.ObjectId(
        currentUser.tenantId
      ),

      entityType: "PARTY",
      entityId: party._id,

      action: "PARTY_CONVERTED_TO_CUSTOMER",

      actorId: new Types.ObjectId(
        currentUser.userId
      ),

      actorRole: currentUser.role,

      oldValue: {
        status: PartyStatus.CONVERTED
      },

      newValue: {
        status: PartyStatus.CUSTOMER,
        erpCustomerCode: customerCode
      },

      metadata: {
        onboardingId: onboarding._id,
        provider: "mock"
      }
    });

    return onboarding;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown ERP synchronization error";

    onboarding.status =
      OnboardingStatus.SYNC_FAILED;

    onboarding.set("erpSync", {
      status: "FAILED",

      attemptCount:
        currentAttemptCount + 1,

      customerCode:
        onboarding.erpSync?.customerCode,

      lastAttemptAt: new Date(),

      lastError: errorMessage
    });

    onboarding.updatedBy =
      new Types.ObjectId(
        currentUser.userId
      );

    await onboarding.save();

    await writeOnboardingAudit(
      onboarding._id,
      "ONBOARDING_ERP_SYNC_FAILED",
      currentUser,
      {
        provider: "mock",
        error: errorMessage
      }
    );

    throw new AppError(
      "Customer creation in BC-365 failed",
      502,
      "ERP_CUSTOMER_CREATION_FAILED",
      {
        reason: errorMessage
      }
    );
  }
}