// import type { FilterQuery } from "mongoose";
import type { FilterQuery } from "mongoose";
import { PartyModel, type PartyDocument } from "./party.model.js";

type ListPartiesInput = {
  tenantId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  area?: string;
  assignedCamId?: string;
  customerType?: string;
  productCategory?: string;
};

export async function createPartyRecord(data: Record<string, unknown>) {
  return PartyModel.create(data);
}

export async function findPartyById(tenantId: string, partyId: string) {
  return PartyModel.findOne({
    _id: partyId,
    tenantId,
    isArchived: false,
  }).lean();
}

export async function listPartyRecords(input: ListPartiesInput) {
  const filter: FilterQuery<PartyDocument> = {
    tenantId: input.tenantId,
    isArchived: false,
  };

  if (input.status) {
    filter.status = input.status;
  }

  if (input.area) {
    filter.area = input.area;
  }

  if (input.assignedCamId) {
    filter.assignedCamId = input.assignedCamId;
  }

  if (input.customerType) {
    filter.customerType = input.customerType;
  }

  if (input.productCategory) {
    filter.productCategory = input.productCategory;
  }

  if (input.search) {
    filter.$or = [
      {
        companyName: {
          $regex: input.search,
          $options: "i",
        },
      },
      {
        mobile: {
          $regex: input.search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: input.search,
          $options: "i",
        },
      },
      {
        gstin: {
          $regex: input.search,
          $options: "i",
        },
      },
    ];
  }

  const skip = (input.page - 1) * input.pageSize;

  const [items, totalItems] = await Promise.all([
    PartyModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(input.pageSize)
      .lean(),

    PartyModel.countDocuments(filter),
  ]);

  return {
    items,
    totalItems,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.ceil(totalItems / input.pageSize),
  };
}

export async function updatePartyById(
  tenantId: string,
  partyId: string,
  update: Record<string, unknown>,
) {
  return PartyModel.findOneAndUpdate(
    {
      _id: partyId,
      tenantId,
      isArchived: false,
    },
    update,
    {
      new: true,
      runValidators: true,
    },
  ).lean();
}
