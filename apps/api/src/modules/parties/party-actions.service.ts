import { Types } from "mongoose";
import { AppError } from "../../common/errors/app-errors.js";

import {
  ActivityType,
  OnboardingStatus,
  PartyStatus,
  UserRole,
} from "../../common/types/workflows-enums.js";
import { ActivityModel } from "../activities/activity.model.js";

import { AuditEventModel } from "../audit/audit-event.model.js";

import { OnboardingRequestModel } from "../onboarding/onboarding.model.js";

import { PartyModel } from "./party.model.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
  email?: string;
};

type PartyDecisionInput = {
  reason: string;
};

const allowedTransitions: Record<string, PartyStatus[]> = {
  [PartyStatus.POTENTIAL]: [PartyStatus.VISITED],

  [PartyStatus.HIGH_POTENTIAL]: [PartyStatus.POTENTIAL],

  [PartyStatus.NOT_INTERESTED]: [
    PartyStatus.VISITED,
    PartyStatus.POTENTIAL,
    PartyStatus.HIGH_POTENTIAL,
  ],

  [PartyStatus.CONVERTED]: [PartyStatus.POTENTIAL, PartyStatus.HIGH_POTENTIAL],
};

function buildOnboardingNumber(partyId: string): string {
  const today = new Date();

  const datePart = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");

  const partyPart = partyId.slice(-6).toUpperCase();

  return `ONB-${datePart}-${partyPart}`;
}

function isDuplicateKeyError(error: unknown): error is {
  code: number;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

async function ensureOnboardingDraft(
  party: InstanceType<typeof PartyModel>,
  currentUser: CurrentUser,
) {
  const existing = await OnboardingRequestModel.findOne({
    tenantId: currentUser.tenantId,
    partyId: party._id,
  });

  if (existing) {
    return existing;
  }

  try {
    const onboarding = await OnboardingRequestModel.create({
      tenantId: new Types.ObjectId(currentUser.tenantId),

      onboardingNumber: buildOnboardingNumber(party._id.toString()),

      partyId: party._id,

      source: party.source,

      customerName: party.companyName,

      mobile: party.mobile,

      email: party.email,

      gstin: party.gstin,

      customerType: party.customerType,

      productCategory: party.productCategory,

      product: party.products?.[0],

      qtyApproxMt: party.qtyApproxMt ?? 0,

      remarks: party.remarks,

      documents: [],
      addresses: [],

      gstVerification: {
        status: "NOT_STARTED",
        mismatchReasons: [],
      },

      status: OnboardingStatus.DRAFT,

      erpSync: {
        status: "NOT_READY",
        attemptCount: 0,
      },

      createdBy: new Types.ObjectId(currentUser.userId),

      updatedBy: new Types.ObjectId(currentUser.userId),
    });

    await AuditEventModel.create({
      tenantId: new Types.ObjectId(currentUser.tenantId),

      entityType: "ONBOARDING",

      entityId: onboarding._id,

      action: "ONBOARDING_DRAFT_CREATED",

      actorId: new Types.ObjectId(currentUser.userId),

      actorRole: currentUser.role,

      newValue: onboarding.toObject(),

      metadata: {
        partyId: party._id,
        source: "PARTY_CONVERSION",
      },
    });

    return onboarding;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const duplicate = await OnboardingRequestModel.findOne({
        tenantId: currentUser.tenantId,
        partyId: party._id,
      });

      if (duplicate) {
        return duplicate;
      }
    }

    throw error;
  }
}

export async function changePartyStatus(
  partyId: string,
  targetStatus: PartyStatus,
  input: PartyDecisionInput,
  currentUser: CurrentUser,
) {
  if (!Types.ObjectId.isValid(partyId)) {
    throw new AppError("Invalid party ID", 400, "INVALID_PARTY_ID");
  }

  const party = await PartyModel.findOne({
    _id: partyId,
    tenantId: currentUser.tenantId,
    isArchived: false,
  });

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  if (
    currentUser.role === UserRole.CAM &&
    party.assignedCamId?.toString() !== currentUser.userId
  ) {
    throw new AppError(
      "A CAM can only update parties assigned to them",
      403,
      "PARTY_OWNER_REQUIRED",
    );
  }

  const allowedSourceStatuses = allowedTransitions[targetStatus] ?? [];

  if (!allowedSourceStatuses.includes(party.status as PartyStatus)) {
    throw new AppError(
      `Party cannot move from ${party.status} to ${targetStatus}`,
      409,
      "INVALID_PARTY_STATUS_TRANSITION",
      {
        currentStatus: party.status,
        targetStatus,
        allowedSourceStatuses,
      },
    );
  }

  const previousStatus = party.status as PartyStatus;

  party.status = targetStatus;

  party.updatedBy = new Types.ObjectId(currentUser.userId);

  await party.save();

  await ActivityModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    partyId: party._id,

    type: ActivityType.NOTE,

    activityAt: new Date(),

    summary: `Party status changed from ${previousStatus} to ${targetStatus}`,

    outcome: input.reason,

    createdBy: new Types.ObjectId(currentUser.userId),
  });

  await AuditEventModel.create({
    tenantId: new Types.ObjectId(currentUser.tenantId),

    entityType: "PARTY",

    entityId: party._id,

    action: "PARTY_STATUS_CHANGED",

    actorId: new Types.ObjectId(currentUser.userId),

    actorRole: currentUser.role,

    oldValue: {
      status: previousStatus,
    },

    newValue: {
      status: targetStatus,
    },

    metadata: {
      reason: input.reason,
    },
  });

  let onboarding = null;

  if (targetStatus === PartyStatus.CONVERTED) {
    onboarding = await ensureOnboardingDraft(party, currentUser);
  }

  return {
    party,
    onboarding,
  };
}
