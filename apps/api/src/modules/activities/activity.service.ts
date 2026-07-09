import mongoose from "mongoose";

import { AppError } from "../../common/errors/app-errors.js";
import { ActivityType, UserRole } from "../../common/types/workflows-enums.js";

import { AuditEventModel } from "../audit/audit-event.model.js";
import { PartyModel } from "../parties/party.model.js";
import { ActivityModel } from "./activity.model.js";

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

type CreateActivityInput = {
  partyId: string;
  type: ActivityType;
  activityAt?: Date;
  summary: string;
  outcome?: string;
  nextFollowUpAt?: Date;
};

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function assertObjectId(value: string, message: string, code: string) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(message, 400, code);
  }
}

export async function createManualActivity(
  input: CreateActivityInput,
  currentUser: CurrentUser,
) {
  assertObjectId(input.partyId, "Invalid party ID", "INVALID_PARTY_ID");

  const tenantId = toObjectId(currentUser.tenantId);
  const partyId = toObjectId(input.partyId);

  const party = await PartyModel.findOne({
    _id: partyId,
    tenantId,
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
      "A CAM can only create activities for assigned parties",
      403,
      "PARTY_OWNER_REQUIRED",
    );
  }

  const activity = await ActivityModel.create({
    tenantId,
    partyId,
    type: input.type,
    activityAt: input.activityAt ?? new Date(),
    summary: input.summary,
    outcome: input.outcome,
    nextFollowUpAt: input.nextFollowUpAt,
    followUpStatus: input.nextFollowUpAt ? "PENDING" : undefined,
    createdBy: toObjectId(currentUser.userId),
  });

  if (input.nextFollowUpAt) {
    party.nextFollowUpAt = input.nextFollowUpAt;
    party.updatedBy = toObjectId(currentUser.userId);
    await party.save();
  }

  await AuditEventModel.create({
    tenantId,
    entityType: "ACTIVITY",
    entityId: activity._id,
    action: "ACTIVITY_CREATED",
    actorId: toObjectId(currentUser.userId),
    actorRole: currentUser.role,
    newValue: activity.toObject(),
    metadata: {
      partyId,
      activityType: input.type,
    },
  });

  if (input.nextFollowUpAt) {
    await AuditEventModel.create({
      tenantId,
      entityType: "PARTY",
      entityId: party._id,
      action: "PARTY_FOLLOW_UP_UPDATED",
      actorId: toObjectId(currentUser.userId),
      actorRole: currentUser.role,
      newValue: {
        nextFollowUpAt: input.nextFollowUpAt,
      },
      metadata: {
        activityId: activity._id,
      },
    });
  }

  return activity;
}

export async function listPartyActivities(
  partyIdValue: string,
  currentUser: CurrentUser,
) {
  assertObjectId(partyIdValue, "Invalid party ID", "INVALID_PARTY_ID");

  const tenantId = toObjectId(currentUser.tenantId);
  const partyId = toObjectId(partyIdValue);

  const party = await PartyModel.findOne({
    _id: partyId,
    tenantId,
    isArchived: false,
  });

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  return ActivityModel.find({
    tenantId,
    partyId,
  })
    .sort({
      activityAt: -1,
      createdAt: -1,
    })
    .limit(100)
    .lean();
}
async function updatePartyNextFollowUp(
  tenantId: mongoose.Types.ObjectId,
  partyId: mongoose.Types.ObjectId,
  currentUser: CurrentUser,
) {
  const nextPendingActivity = await ActivityModel.findOne({
    tenantId,
    partyId,
    nextFollowUpAt: {
      $exists: true,
      $ne: null,
    },
    followUpStatus: {
      $ne: "COMPLETED",
    },
  })
    .sort({
      nextFollowUpAt: 1,
    })
    .lean();

  const party = await PartyModel.findOne({
    _id: partyId,
    tenantId,
    isArchived: false,
  });

  if (!party) {
    return;
  }

  party.nextFollowUpAt = nextPendingActivity?.nextFollowUpAt;
  party.updatedBy = toObjectId(currentUser.userId);

  await party.save();

  await AuditEventModel.create({
    tenantId,
    entityType: "PARTY",
    entityId: party._id,
    action: "PARTY_FOLLOW_UP_UPDATED",
    actorId: toObjectId(currentUser.userId),
    actorRole: currentUser.role,
    newValue: {
      nextFollowUpAt: party.nextFollowUpAt,
    },
    metadata: {
      source: "FOLLOW_UP_STATUS_CHANGE",
    },
  });
}

export async function completeFollowUp(
  activityId: string,
  input: {
    completionNote?: string;
  },
  currentUser: CurrentUser,
) {
  assertObjectId(
    activityId,
    "Invalid activity ID",
    "INVALID_ACTIVITY_ID",
  );

  const tenantId = toObjectId(currentUser.tenantId);
  const activity = await ActivityModel.findOne({
    _id: toObjectId(activityId),
    tenantId,
  });

  if (!activity) {
    throw new AppError(
      "Activity not found",
      404,
      "ACTIVITY_NOT_FOUND",
    );
  }

  if (!activity.nextFollowUpAt) {
    throw new AppError(
      "This activity does not have a follow-up date",
      409,
      "FOLLOW_UP_NOT_AVAILABLE",
    );
  }

  if (activity.followUpStatus === "COMPLETED") {
    throw new AppError(
      "Follow-up is already completed",
      409,
      "FOLLOW_UP_ALREADY_COMPLETED",
    );
  }

  const party = await PartyModel.findOne({
    _id: activity.partyId,
    tenantId,
    isArchived: false,
  });

  if (!party) {
    throw new AppError(
      "Linked party not found",
      404,
      "PARTY_NOT_FOUND",
    );
  }

  if (
    currentUser.role === UserRole.CAM &&
    party.assignedCamId?.toString() !== currentUser.userId
  ) {
    throw new AppError(
      "A CAM can only complete follow-ups for assigned parties",
      403,
      "PARTY_OWNER_REQUIRED",
    );
  }

  activity.followUpStatus = "COMPLETED";
  activity.followUpCompletedAt = new Date();
  activity.followUpCompletedBy = toObjectId(currentUser.userId);
  activity.followUpCompletionNote = input.completionNote;

  await activity.save();

  await updatePartyNextFollowUp(
    tenantId,
    activity.partyId,
    currentUser,
  );

  await AuditEventModel.create({
    tenantId,
    entityType: "ACTIVITY",
    entityId: activity._id,
    action: "FOLLOW_UP_COMPLETED",
    actorId: toObjectId(currentUser.userId),
    actorRole: currentUser.role,
    newValue: {
      followUpStatus: activity.followUpStatus,
      followUpCompletedAt: activity.followUpCompletedAt,
      followUpCompletionNote: activity.followUpCompletionNote,
    },
    metadata: {
      partyId: activity.partyId,
    },
  });

  return activity;
}

export async function reopenFollowUp(
  activityId: string,
  currentUser: CurrentUser,
) {
  assertObjectId(
    activityId,
    "Invalid activity ID",
    "INVALID_ACTIVITY_ID",
  );

  const tenantId = toObjectId(currentUser.tenantId);

  const activity = await ActivityModel.findOne({
    _id: toObjectId(activityId),
    tenantId,
  });

  if (!activity) {
    throw new AppError(
      "Activity not found",
      404,
      "ACTIVITY_NOT_FOUND",
    );
  }

  if (!activity.nextFollowUpAt) {
    throw new AppError(
      "This activity does not have a follow-up date",
      409,
      "FOLLOW_UP_NOT_AVAILABLE",
    );
  }

  activity.followUpStatus = "PENDING";
  activity.followUpCompletedAt = undefined;
  activity.followUpCompletedBy = undefined;
  activity.followUpCompletionNote = undefined;

  await activity.save();

  await updatePartyNextFollowUp(
    tenantId,
    activity.partyId,
    currentUser,
  );

  await AuditEventModel.create({
    tenantId,
    entityType: "ACTIVITY",
    entityId: activity._id,
    action: "FOLLOW_UP_REOPENED",
    actorId: toObjectId(currentUser.userId),
    actorRole: currentUser.role,
    newValue: {
      followUpStatus: activity.followUpStatus,
    },
    metadata: {
      partyId: activity.partyId,
    },
  });

  return activity;
}