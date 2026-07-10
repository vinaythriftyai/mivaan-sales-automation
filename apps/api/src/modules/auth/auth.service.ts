import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import { AppError } from "../../common/errors/app-errors.js";
import { env } from "../../config/env.js";
import { UserModel } from "../users/user.model.js";

type SignupRole =
  | "CAM"
  | "HOD"
  | "SALES"
  | "SYSTEM_ADMIN"
  | "ACCOUNTS";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: SignupRole;
  territory?: string;
  division?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

function generateAccessToken(user: {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  role: string;
  email: string;
}): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );
}

export async function signupUser(input: SignupInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const tenantId = new Types.ObjectId(env.DEFAULT_TENANT_ID);

  const existingUser = await UserModel.findOne({
    tenantId,
    email: normalizedEmail,
  }).lean();

  if (existingUser) {
    throw new AppError(
      "A user with this email already exists",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const selectedRole = input.role ?? "CAM";

  const user = await UserModel.create({
    tenantId,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: selectedRole,
    territory: input.territory,
    division: input.division,
    isActive: true,
  });

  const accessToken = generateAccessToken({
    _id: user._id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  });

  return {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      territory: user.territory,
      division: user.division,
    },
  };
}

export async function loginUser(input: LoginInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const tenantId = new Types.ObjectId(env.DEFAULT_TENANT_ID);

  const user = await UserModel.findOne({
    tenantId,
    email: normalizedEmail,
    isActive: true,
  }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const accessToken = generateAccessToken({
    _id: user._id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  });

  return {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      territory: user.territory,
      division: user.division,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  return user;
}