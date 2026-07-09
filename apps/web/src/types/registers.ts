export type RegisterParty = {
  _id: string;
  companyName: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  status: string;
  customerType?: string;
  productCategory?: string;
  products?: string[];
  qtyApproxMt?: number;
  city?: string;
  area?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type McaCustomer = {
  _id: string;
  onboardingNumber: string;
  customerName: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  customerType?: string;
  productCategory?: string;
  qtyApproxMt?: number;
  status: string;
  erpSync?: {
    status?: string;
    customerCode?: string;
    attemptCount?: number;
  };
  partyId?:
    | string
    | {
        _id: string;
        companyName: string;
        mobile?: string;
        status?: string;
      };
  createdAt?: string;
  updatedAt?: string;
};

export type RegisterActivity = {
  _id: string;
  type: string;
  summary?: string;
  outcome?: string;
  activityAt?: string;
  nextFollowUpAt?: string;
  followUpStatus?: "PENDING" | "COMPLETED";
  followUpCompletedAt?: string;
  followUpCompletionNote?: string;
  createdAt?: string;
  partyId?:
    | string
    | {
        _id: string;
        companyName: string;
        mobile?: string;
        status?: string;
      };
};
