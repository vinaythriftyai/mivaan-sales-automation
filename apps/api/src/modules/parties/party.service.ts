//port { AppError } from "../../common/errors/app-error.js";
import { AppError } from "../../common/errors/app-errors.js";
//port { PartyStatus } from "../../common/types/workflow-enums.js";
import { PartyStatus } from "../../common/types/workflows-enums.js";
//AuditEventModel } from "../audit/audit-event.model.js";
import { AuditEventModel } from "../audit/audit-event.model.js";
import { checkPartyDuplicates } from "./duplicate.service.js";
import {
  createPartyRecord,
  findPartyById,
  listPartyRecords,
  updatePartyById
} from "./party.respository.js"

type CurrentUser = {
  userId: string;
  tenantId: string;
  role: string;
};

type CreatePartyInput = {
  companyName: string;
  legalName?: string;
  tradeName?: string;
  mobile: string;
  email?: string;
  source: string;
  customerType: string;
  productCategory: string;
  products?: string[];
  qtyApproxMt?: number;
  area?: string;
  city?: string;
  address?: string;
  gstin?: string;
  cin?: string;
  assignedCamId?: string;
  remarks?: string;
};

export async function createParty(
  input: CreatePartyInput,
  currentUser: CurrentUser
) {
  const duplicates = await checkPartyDuplicates({
    tenantId: currentUser.tenantId,
    companyName: input.companyName,
    gstin: input.gstin,
    mobile: input.mobile,
    email: input.email
  });

  if (duplicates.exactGstin) {
    throw new AppError(
      "A party with this GSTIN already exists",
      409,
      "DUPLICATE_GSTIN",
      {
        existingPartyId: duplicates.exactGstin._id
      }
    );
  }

  const party = await createPartyRecord({
    tenantId: currentUser.tenantId,
    ...input,
    status: PartyStatus.LEAD,
    createdBy: currentUser.userId,
    updatedBy: currentUser.userId
  });

  await AuditEventModel.create({
    tenantId: currentUser.tenantId,
    entityType: "PARTY",
    entityId: party._id,
    action: "PARTY_CREATED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    newValue: party.toObject(),
    metadata: {
      duplicateWarnings: duplicates.warnings
    }
  });

  return {
    party,
    duplicateWarnings: duplicates.warnings
  };
}

export async function getParties(
  query: Record<string, string | undefined>,
  currentUser: CurrentUser
) {
  const page = Math.max(Number(query.page ?? 1), 1);
  const pageSize = Math.min(
    Math.max(Number(query.pageSize ?? 20), 1),
    100
  );

  return listPartyRecords({
    tenantId: currentUser.tenantId,
    page,
    pageSize,
    search: query.search,
    status: query.status,
    area: query.area,
    assignedCamId: query.assignedCamId,
    customerType: query.customerType,
    productCategory: query.productCategory
  });
}

export async function getParty(
  partyId: string,
  currentUser: CurrentUser
) {
  const party = await findPartyById(
    currentUser.tenantId,
    partyId
  );

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  return party;
}

export async function updateParty(
  partyId: string,
  input: Record<string, unknown>,
  currentUser: CurrentUser
) {
  const existingParty = await findPartyById(
    currentUser.tenantId,
    partyId
  );

  if (!existingParty) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  // Prevent generic status manipulation
  delete input.status;
  delete input.erpCustomerCode;
  delete input.convertedAt;
  delete input.tenantId;
  delete input.createdBy;

  const updatedParty = await updatePartyById(
    currentUser.tenantId,
    partyId,
    {
      ...input,
      updatedBy: currentUser.userId
    }
  );

  await AuditEventModel.create({
    tenantId: currentUser.tenantId,
    entityType: "PARTY",
    entityId: partyId,
    action: "PARTY_UPDATED",
    actorId: currentUser.userId,
    actorRole: currentUser.role,
    oldValue: existingParty,
    newValue: updatedParty
  });

  return updatedParty;
}