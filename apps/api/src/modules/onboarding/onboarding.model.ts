// import { model, Schema, type InferSchemaType } from "mongoose";
// import { DocumentType, ErpSyncStatus, GstVerificationStatus, OnboardingSource, OnboardingStatus } from "../../common/types/workflows-enums.js";

// // import {
// //   DocumentType,
// //   ErpSyncStatus,
// //   GstVerificationStatus,
// //   OnboardingSource,
// //   OnboardingStatus
// // } from "../../common/types/workflow-enums.js";

// const uploadedDocumentSchema = new Schema(
//   {
//     type: {
//       type: String,
//       enum: Object.values(DocumentType),
//       required: true
//     },
//     originalName: String,
//     storedName: String,
//     storagePath: String,
//     mimeType: String,
//     sizeBytes: Number,
//     uploadedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User"
//     },
//     uploadedAt: {
//       type: Date,
//       default: Date.now
//     }
//   },
//   { _id: true }
// );

// const addressSchema = new Schema(
//   {
//     label: String,
//     line1: String,
//     line2: String,
//     city: String,
//     state: String,
//     pinCode: String,
//     source: {
//       type: String,
//       enum: ["OCR", "GST_PORTAL", "MANUAL", "MCA"]
//     }
//   },
//   { _id: true }
// );

// const onboardingSchema = new Schema(
//   {
//     tenantId: {
//       type: Schema.Types.ObjectId,
//       required: true,
//       index: true
//     },

//     onboardingNumber: {
//       type: String,
//       required: true
//     },

//     partyId: {
//       type: Schema.Types.ObjectId,
//       ref: "Party",
//       required: true,
//       index: true
//     },

//     source: {
//       type: String,
//       enum: Object.values(OnboardingSource),
//       required: true
//     },

//     customerName: {
//       type: String,
//       required: true
//     },

//     mobile: {
//       type: String,
//       required: true
//     },

//     email: {
//       type: String
//     },

//     gstin: {
//       type: String,
//       uppercase: true,
//       trim: true
//     },

//     customerType: {
//       type: String,
//       required: true
//     },

//     productCategory: {
//       type: String,
//       required: true
//     },

//     product: {
//       type: String
//     },

//     qtyApproxMt: {
//       type: Number,
//       required: true,
//       min: 0
//     },

//     remarks: {
//       type: String
//     },

//     documents: {
//       type: [uploadedDocumentSchema],
//       default: []
//     },

//     extractedData: {
//       legalName: String,
//       tradeName: String,
//       gstin: String,
//       pan: String,
//       registrationStatus: String,
//       addresses: [addressSchema],
//       confidence: Number,
//       extractedAt: Date,
//       provider: String
//     },

//     verifiedData: {
//       legalName: String,
//       tradeName: String,
//       gstin: String,
//       pan: String
//     },

//     addresses: {
//       type: [addressSchema],
//       default: []
//     },

//     selectedAddressId: {
//       type: Schema.Types.ObjectId
//     },

//     gstVerification: {
//       status: {
//         type: String,
//         enum: Object.values(GstVerificationStatus),
//         default: GstVerificationStatus.NOT_STARTED
//       },
//       isActive: Boolean,
//       portalLegalName: String,
//       verifiedAt: Date,
//       provider: String,
//       mismatchReasons: [String]
//     },

//     status: {
//       type: String,
//       enum: Object.values(OnboardingStatus),
//       default: OnboardingStatus.DRAFT,
//       index: true
//     },

//     approvalId: {
//       type: Schema.Types.ObjectId,
//       ref: "Approval"
//     },

//     erpSync: {
//       status: {
//         type: String,
//         enum: Object.values(ErpSyncStatus),
//         default: ErpSyncStatus.NOT_READY
//       },
//       attemptCount: {
//         type: Number,
//         default: 0
//       },
//       customerCode: String,
//       lastAttemptAt: Date,
//       lastError: String,
//       requestId: String
//     },

//     submittedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User"
//     },

//     submittedAt: Date,

//     approvedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User"
//     },

//     approvedAt: Date,

//     rejectionReason: String,

//     createdBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },

//     updatedBy: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     }
//   },
// //   {
// //     timestamps: true,
// //     versionKey: true
// //   }
// );

// onboardingSchema.index(
//   {
//     tenantId: 1,
//     onboardingNumber: 1
//   },
//   {
//     unique: true
//   }
// );

// onboardingSchema.index({
//   tenantId: 1,
//   status: 1,
//   createdAt: -1
// });

// export type OnboardingDocument = InferSchemaType<
//   typeof onboardingSchema
// >;

// export const OnboardingModel = model(
//   "OnboardingRequest",
//   onboardingSchema
// );

import mongoose from "mongoose";
import type { InferSchemaType } from "mongoose";

import { OnboardingStatus } from "../../common/types/workflows-enums.js";
const { Schema } = mongoose;
const onboardingDocumentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["GST_CERTIFICATE", "TRADE_DECLARATION"],
    },

    originalName: {
      type: String,
    },

    storagePath: {
      type: String,
    },

    mimeType: {
      type: String,
    },

    sizeBytes: {
      type: Number,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

const onboardingAddressSchema = new Schema(
  {
    label: {
      type: String,
    },

    line1: {
      type: String,
    },

    line2: {
      type: String,
    },

    city: {
      type: String,
    },

    state: {
      type: String,
    },

    pinCode: {
      type: String,
    },

    source: {
      type: String,
    },
  },
  {
    _id: true,
  },
);

const extractedDataSchema = new Schema(
  {
    legalName: {
      type: String,
    },

    tradeName: {
      type: String,
    },

    gstin: {
      type: String,
    },

    pan: {
      type: String,
    },

    registrationStatus: {
      type: String,
    },

    addresses: {
      type: [onboardingAddressSchema],
      default: [],
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  {
    _id: false,
  },
);

const verifiedDataSchema = new Schema(
  {
    legalName: {
      type: String,
    },

    tradeName: {
      type: String,
    },

    gstin: {
      type: String,
    },

    pan: {
      type: String,
    },
  },
  {
    _id: false,
  },
);

const gstVerificationSchema = new Schema(
  {
    status: {
      type: String,
      default: "NOT_STARTED",
    },

    isActive: {
      type: Boolean,
    },

    portalLegalName: {
      type: String,
    },

    verifiedAt: {
      type: Date,
    },

    mismatchReasons: {
      type: [String],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const erpSyncSchema = new Schema(
  {
    status: {
      type: String,
      default: "NOT_READY",
    },

    attemptCount: {
      type: Number,
      default: 0,
    },

    customerCode: {
      type: String,
    },

    lastAttemptAt: {
      type: Date,
    },

    lastError: {
      type: String,
    },
  },
  {
    _id: false,
  },
);

const onboardingRequestSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    onboardingNumber: {
      type: String,
      required: true,
      trim: true,
    },

    partyId: {
      type: Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true,
    },

    source: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    gstin: {
      type: String,
      uppercase: true,
      trim: true,
    },

    customerType: {
      type: String,
      required: true,
    },

    productCategory: {
      type: String,
      required: true,
    },

    product: {
      type: String,
    },

    qtyApproxMt: {
      type: Number,
      default: 0,
      min: 0,
    },

    remarks: {
      type: String,
    },

    documents: {
      type: [onboardingDocumentSchema],
      default: [],
    },

    extractedData: {
      type: extractedDataSchema,
    },

    verifiedData: {
      type: verifiedDataSchema,
    },

    addresses: {
      type: [onboardingAddressSchema],
      default: [],
    },

    selectedAddressId: {
      type: Schema.Types.ObjectId,
    },

    gstVerification: {
      type: gstVerificationSchema,
      default: () => ({
        status: "NOT_STARTED",
        mismatchReasons: [],
      }),
    },

    status: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.DRAFT,
      index: true,
    },
    submittedAt: {
      type: Date,
    },

    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    approverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    approvedAt: {
      type: Date,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    rejectedAt: {
      type: Date,
    },

    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    erpSync: {
      type: erpSyncSchema,
      default: () => ({
        status: "NOT_READY",
        attemptCount: 0,
      }),
    },

    rejectionReason: {
      type: String,
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
  },
  {
    timestamps: true,
    collection: "onboardings",
  },
);

onboardingRequestSchema.index(
  {
    tenantId: 1,
    onboardingNumber: 1,
  },
  {
    unique: true,
  },
);

onboardingRequestSchema.index(
  {
    tenantId: 1,
    partyId: 1,
  },
  {
    unique: true,
  },
);
onboardingRequestSchema.index({
  tenantId: 1,
  approverId: 1,
  status: 1,
});
export type OnboardingRequestDocument = InferSchemaType<
  typeof onboardingRequestSchema
>;

export const OnboardingRequestModel =
  mongoose.models.OnboardingRequest ??
  mongoose.model("OnboardingRequest", onboardingRequestSchema);
