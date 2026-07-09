import { model, Schema, type InferSchemaType } from "mongoose";

import {
  PartySource,
  PartyStatus,
} from "../../common/types/workflows-enums.js";
const partySchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    legalName: {
      type: String,
      trim: true,
    },

    tradeName: {
      type: String,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    source: {
      type: String,
      enum: Object.values(PartySource),
      required: true,
    },

    customerType: {
      type: String,
      required: true,
      trim: true,
    },

    productCategory: {
      type: String,
      required: true,
      trim: true,
    },

    products: {
      type: [String],
      default: [],
    },

    qtyApproxMt: {
      type: Number,
      min: 0,
    },

    area: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    cin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,
      enum: Object.values(PartyStatus),
      default: PartyStatus.LEAD,
      index: true,
    },

    assignedCamId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    remarks: {
      type: String,
      trim: true,
    },

    lastFollowUpAt: {
      type: Date,
    },

    nextFollowUpAt: {
      type: Date,
      index: true,
    },

    erpCustomerCode: {
      type: String,
      trim: true,
    },

    convertedAt: {
      type: Date,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  //   {
  //     timestamps: true,
  //     versionKey: true,
  //   },
);

partySchema.index(
  {
    tenantId: 1,
    gstin: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

partySchema.index({
  tenantId: 1,
  companyName: 1,
});

partySchema.index({
  tenantId: 1,
  mobile: 1,
});

partySchema.index({
  tenantId: 1,
  status: 1,
  assignedCamId: 1,
});
partySchema.index(
  {
    tenantId: 1,
    erpCustomerCode: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      erpCustomerCode: {
        $type: "string",
        $gt: "",
      },
    },
  },
);
export type PartyDocument = InferSchemaType<typeof partySchema>;

export const PartyModel = model("Party", partySchema);
