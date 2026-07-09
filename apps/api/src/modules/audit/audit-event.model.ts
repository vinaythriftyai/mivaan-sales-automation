import { model, Schema, type InferSchemaType } from "mongoose";

const auditEventSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    entityType: {
      type: String,
      required: true,
      index: true
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    action: {
      type: String,
      required: true
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    actorRole: {
      type: String
    },

    oldValue: {
      type: Schema.Types.Mixed
    },

    newValue: {
      type: Schema.Types.Mixed
    },

    metadata: {
      type: Schema.Types.Mixed
    },

    occurredAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

auditEventSchema.index({
  tenantId: 1,
  entityType: 1,
  entityId: 1,
  occurredAt: -1
});

export type AuditEventDocument = InferSchemaType<
  typeof auditEventSchema
>;

export const AuditEventModel = model(
  "AuditEvent",
  auditEventSchema
);