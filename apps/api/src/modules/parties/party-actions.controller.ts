import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-errors.js";

import { PartyStatus } from "../../common/types/workflows-enums.js";
import { changePartyStatus } from "./party-actions.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return request.user;
}

async function runPartyAction(
  request: Request,
  response: Response,
  targetStatus: PartyStatus,
): Promise<void> {
  const result = await changePartyStatus(
    request.params.partyId,
    targetStatus,
    request.body,
    requireCurrentUser(request),
  );

  response.status(200).json({
    success: true,
    data: result,
  });
}

export async function markPotentialController(
  request: Request,
  response: Response,
): Promise<void> {
  await runPartyAction(request, response, PartyStatus.POTENTIAL);
}

export async function markHighPotentialController(
  request: Request,
  response: Response,
): Promise<void> {
  await runPartyAction(request, response, PartyStatus.HIGH_POTENTIAL);
}

export async function markNotInterestedController(
  request: Request,
  response: Response,
): Promise<void> {
  await runPartyAction(request, response, PartyStatus.NOT_INTERESTED);
}

export async function convertPartyController(
  request: Request,
  response: Response,
): Promise<void> {
  await runPartyAction(request, response, PartyStatus.CONVERTED);
}
