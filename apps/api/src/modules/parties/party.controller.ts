import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-errors.js";
//port { AppError } from "../../common/errors/app-error.js";
import {
  createParty,
  getParties,
  getParty,
  updateParty
} from "./party.service.js";

function requireCurrentUser(request: Request) {
  if (!request.user) {
    throw new AppError(
      "Authentication required",
      401,
      "AUTH_REQUIRED"
    );
  }

  return request.user;
}

export async function createPartyController(
  request: Request,
  response: Response
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const result = await createParty(
    request.body,
    currentUser
  );

  response.status(201).json({
    success: true,
    data: result
  });
}

export async function listPartiesController(
  request: Request,
  response: Response
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const result = await getParties(
    request.query as Record<string, string | undefined>,
    currentUser
  );

  response.status(200).json({
    success: true,
    data: result.items,
    meta: {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    }
  });
}

export async function getPartyController(
  request: Request,
  response: Response
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const party = await getParty(
    request.params.partyId,
    currentUser
  );

  response.status(200).json({
    success: true,
    data: party
  });
}

export async function updatePartyController(
  request: Request,
  response: Response
): Promise<void> {
  const currentUser = requireCurrentUser(request);

  const party = await updateParty(
    request.params.partyId,
    request.body,
    currentUser
  );

  response.status(200).json({
    success: true,
    data: party
  });
}