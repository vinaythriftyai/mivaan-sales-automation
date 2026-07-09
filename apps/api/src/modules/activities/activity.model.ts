import { model, Schema, type InferSchemaType } from "mongoose";
import mongoose from "mongoose";
import { ActivityType } from "../../common/types/workflows-enums.js";
const activitySchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    partyId: {
      type: Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
    },

    activityAt: {
      type: Date,
      required: true,
      index: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    outcome: {
      type: String,
      trim: true,
    },

    nextFollowUpAt: {
      type: Date,
      index: true,
    },
    followUpStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
    },

    followUpCompletedAt: {
      type: Date,
    },

    followUpCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    followUpCompletionNote: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    visitReportId: {
      type: Schema.Types.ObjectId,
      ref: "VisitReport",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({
  tenantId: 1,
  partyId: 1,
  activityAt: -1,
});

export type ActivityDocument = InferSchemaType<typeof activitySchema>;

export const ActivityModel = model("Activity", activitySchema);
