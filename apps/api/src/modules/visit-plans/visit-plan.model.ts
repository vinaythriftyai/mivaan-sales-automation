import { model, Schema, type InferSchemaType } from "mongoose";

// import {
//   PartySource,
//   VisitPlanStatus
// } from "../../common/types/workflow-enums.js";

import { PartySource,VisitPlanStatus } from "../../common/types/workflows-enums.js";
const visitPlanItemSchema = new Schema(
  {
    partyId: {
      type: Schema.Types.ObjectId,
      ref: "Party",
      required: true
    },

    partySource: {
      type: String,
      enum: Object.values(PartySource),
      required: true
    },

    customerNameSnapshot: {
      type: String,
      required: true
    },

    productRange: {
      type: [String],
      default: []
    },

    lastVisitedAt: {
      type: Date
    },

    dispatchQtyLastThreeMonthsMt: {
      type: Number,
      min: 0,
      default: 0
    },

    remarks: {
      type: String,
      trim: true
    }
  },
  {
    _id: true
  }
);

const visitPlanSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    planNumber: {
      type: String,
      required: true
    },

    division: {
      type: String,
      required: true
    },

    camId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    dateFrom: {
      type: Date,
      required: true
    },

    dateTo: {
      type: Date,
      required: true
    },

    area: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    items: {
      type: [visitPlanItemSchema],
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "At least one visit item is required"
      }
    },

    status: {
      type: String,
      enum: Object.values(VisitPlanStatus),
      default: VisitPlanStatus.DRAFT,
      index: true
    },

    submittedAt: {
      type: Date
    },

    approvedAt: {
      type: Date
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    rejectedAt: {
      type: Date
    },

    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    rejectionReason: {
      type: String
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
//   {
//     timestamps: true,
//     versionKey: true
//   }
);

visitPlanSchema.index(
  {
    tenantId: 1,
    planNumber: 1
  },
  {
    unique: true
  }
);

visitPlanSchema.index({
  tenantId: 1,
  camId: 1,
  status: 1,
  dateFrom: 1
});

export type VisitPlanDocument = InferSchemaType<typeof visitPlanSchema>;

export const VisitPlanModel = model("VisitPlan", visitPlanSchema);