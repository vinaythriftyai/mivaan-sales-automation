import { model, Schema, type InferSchemaType } from "mongoose";
import { ApprovalEntityType, ApprovalStatus } from "../../common/types/workflows-enums.js";


const approvalSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    entityType: {
      type: String,
      enum: Object.values(ApprovalEntityType),
      required: true
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
      index: true
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    approverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    requestedAt: {
      type: Date,
      default: Date.now
    },

    decidedAt: {
      type: Date
    },

    decisionReason: {
      type: String,
      trim: true
    }
  },
//   {
//     timestamps: true,
//     versionKey: true
//   }
);

approvalSchema.index({
  tenantId: 1,
  entityType: 1,
  entityId: 1,
  status: 1
});

export type ApprovalDocument = InferSchemaType<typeof approvalSchema>;

export const ApprovalModel = model("Approval", approvalSchema);