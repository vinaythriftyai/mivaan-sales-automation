export type DashboardSummary = {
  leadFunnel: {
    totalLeads: number;
    visitedParties: number;
    potentialCustomers: number;
    highPotentialCustomers: number;
    convertedCustomers: number;
    customersCreated: number;
  };

  visitPlans: {
    pendingApproval: number;
    approved: number;
    rejected: number;
  };

  onboarding: {
    drafts: number;
    readyForReview: number;
    pendingApproval: number;
    approved: number;
    customerCreated: number;
  };

  approvals: {
    pending: number;
  };

  recentActivities: Array<{
    _id: string;
    type: string;
    summary?: string;
    outcome?: string;
    activityAt?: string;
    createdAt?: string;
  }>;
};