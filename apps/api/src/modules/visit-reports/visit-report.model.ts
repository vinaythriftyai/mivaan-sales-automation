import { model, Schema, type InferSchemaType } from "mongoose";

import { VisitReportStatus } from "../../common/types/workflows-enums.js";
const visitReportSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    visitPlanId: {
      type: Schema.Types.ObjectId,
      ref: "VisitPlan",
      required: true
    },

    visitPlanItemId: {
      type: Schema.Types.ObjectId,
      required: true
    },

    partyId: {
      type: Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true
    },

    camId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    visitedAt: {
      type: Date,
      required: true
    },

    contactPerson: {
      type: String,
      trim: true
    },

    customerType: {
      type: String,
      required: true
    },

    productCategory: {
      type: String,
      required: true
    },

    products: {
      type: [String],
      default: []
    },

    qtyApproxMt: {
      type: Number,
      min: 0
    },

    productFit: {
      type: Boolean,
      required: true
    },

    seriousness: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"],
      default: "UNKNOWN"
    },

    expectedDemand: {
      type: String
    },

    outcomeSummary: {
      type: String,
      required: true,
      trim: true
    },

    remarks: {
      type: String,
      trim: true
    },

    lastFollowUpAt: {
      type: Date
    },

    nextFollowUpAt: {
      type: Date
    },

    aiRecommendation: {
      recommendedStatus: String,
      confidence: Number,
      reasons: [String],
      generatedAt: Date,
      provider: String
    },

    humanDecision: {
      selectedStatus: String,
      reason: String,
      decidedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      decidedAt: Date
    },

    status: {
      type: String,
      enum: Object.values(VisitReportStatus),
      default: VisitReportStatus.DRAFT
    },

    submittedAt: {
      type: Date
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

visitReportSchema.index(
  {
    tenantId: 1,
    visitPlanId: 1,
    visitPlanItemId: 1
  },
  {
    unique: true
  }
);

export type VisitReportDocument = InferSchemaType<
  typeof visitReportSchema
>;

export const VisitReportModel = model("VisitReport", visitReportSchema);

// When the report is submitted:

// Verify Visit Plan status is APPROVED.
// Verify the plan item belongs to the selected party.
// Save the report.
// Set party status to VISITED.
// Update last and next follow-up dates.
// Create an Activity record.
// Create an Audit Event.
// Optionally call the mock AI recommendation provider.