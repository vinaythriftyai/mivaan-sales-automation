import bcrypt from "bcryptjs";
import { model, Schema, type InferSchemaType } from "mongoose";
import { UserRole } from "../../common/types/workflows-enums.js";
const userSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },

    territory: {
      type: String,
      trim: true,
    },

    division: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
//   {
//     timestamps: true,
//     versionKey: true,
//   },
);

userSchema.index(
  {
    tenantId: 1,
    email: 1,
  },
  {
    unique: true,
  },
);

userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel = model("User", userSchema);
