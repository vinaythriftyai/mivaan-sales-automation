import type { Request, Response } from "express";

import { AppError } from "../../common/errors/app-errors.js";

import {
  listActivityRegister,
  listExistingCustomers,
  listFollowUpRegister,
  listMcaCustomers,
  listPotentialCustomers,
} from "./register.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

export async function listPotentialCustomersController(
  request: Request,
  response: Response,
): Promise<void> {
  const records = await listPotentialCustomers(requireCurrentUser(request));

  response.status(200).json({
    success: true,
    data: records,
  });
}

export async function listExistingCustomersController(
  request: Request,
  response: Response,
): Promise<void> {
  const records = await listExistingCustomers(requireCurrentUser(request));

  response.status(200).json({
    success: true,
    data: records,
  });
}

export async function listMcaCustomersController(
  request: Request,
  response: Response,
): Promise<void> {
  const records = await listMcaCustomers(requireCurrentUser(request));

  response.status(200).json({
    success: true,
    data: records,
  });
}

export async function listActivityRegisterController(
  request: Request,
  response: Response,
): Promise<void> {
  const records = await listActivityRegister(requireCurrentUser(request));

  response.status(200).json({
    success: true,
    data: records,
  });
}

export async function listFollowUpRegisterController(
  request: Request,
  response: Response,
): Promise<void> {
  const records = await listFollowUpRegister(requireCurrentUser(request));

  response.status(200).json({
    success: true,
    data: records,
  });
}