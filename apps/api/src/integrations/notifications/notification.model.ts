import { model, Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL", "WHATSAPP"],
      required: true
    },

    type: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    entityType: String,
    entityId: Schema.Types.ObjectId,

    status: {
      type: String,
      enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "READ"],
      default: "PENDING"
    },

    sentAt: Date,
    readAt: Date,
    failureReason: String
  },
  {
    timestamps: true,
    collection: "notifications"
  }
);

notificationSchema.index({
  recipientId: 1,
  status: 1,
  createdAt: -1
});

export const NotificationModel = model(
  "Notification",
  notificationSchema
);