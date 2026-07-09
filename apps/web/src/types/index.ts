export type UserRole =
  "CAM" | "SALES" | "ACCOUNTS" | "HOD" | "IT_ADMIN" | "SYSTEM_ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  territory?: string;
  division?: string;
};

export type ApiResponse<T> = { success: true; data: T };
export type LoginResponse = ApiResponse<{
  accessToken: string;
  user: AuthUser;
}>;

export type Party = {
  _id: string;
  companyName: string;
  legalName?: string;
  tradeName?: string;
  mobile: string;
  email?: string;
  source: string;
  customerType: string;
  productCategory: string;
  products: string[];
  qtyApproxMt?: number;
  area?: string;
  city?: string;
  address?: string;
  gstin?: string;
  cin?: string;
  status: string;
  remarks?: string;
  lastFollowUpAt?: string;
  nextFollowUpAt?: string;
  erpCustomerCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type PartyListResponse = {
  success: true;
  data: Party[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type VisitPlanItem = {
  _id?: string;
  partyId: string | Party;
  partySource: string;
  customerNameSnapshot: string;
  productRange: string[];
  remarks?: string;
};

export type VisitPlan = {
  _id: string;
  planNumber: string;
  division: string;
  camId: string | { _id: string; name: string; email?: string };
  dateFrom: string;
  dateTo: string;
  area: string;
  city: string;
  items: VisitPlanItem[];
  status: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
};

export type OnboardingRequest = {
  _id: string;
  onboardingNumber: string;
  partyId: string | Party;
  source: string;
  customerName: string;
  mobile: string;
  email?: string;
  gstin?: string;
  customerType: string;
  productCategory: string;
  product?: string;
  qtyApproxMt: number;
  remarks?: string;
  documents: Array<{ _id?: string; type: string; originalName?: string }>;
  addresses: Array<{
    _id?: string;
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  }>;
  selectedAddressId?: string;
  extractedData?: {
    legalName?: string;
    tradeName?: string;
    gstin?: string;
    pan?: string;
    registrationStatus?: string;
    confidence?: number;
  };
  gstVerification?: {
    status?: string;
    isActive?: boolean;
    portalLegalName?: string;
    mismatchReasons?: string[];
  };
  erpSync?: {
    status?: string;
    attemptCount?: number;
    customerCode?: string;
    lastAttemptAt?: string;
    lastError?: string;
  };
  status: string;
  createdAt: string;
};
