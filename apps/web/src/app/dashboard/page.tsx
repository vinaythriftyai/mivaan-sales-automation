"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

const emptySummary: DashboardSummary = {
  leadFunnel: {
    totalLeads: 0,
    visitedParties: 0,
    potentialCustomers: 0,
    highPotentialCustomers: 0,
    convertedCustomers: 0,
    customersCreated: 0,
  },
  visitPlans: {
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
  },
  onboarding: {
    drafts: 0,
    readyForReview: 0,
    pendingApproval: 0,
    approved: 0,
    customerCreated: 0,
  },
  approvals: {
    pending: 0,
  },
  recentActivities: [],
};

function formatDate(value?: string) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricCard({
  label,
  value,
  helper,
  href,
}: {
  label: string;
  value: number;
  helper: string;
  href?: string;
}) {
  const card = (
    <div className="app-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold text-primary">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </div>
  );

  if (!href) {
    return card;
  }

  return <Link href={href}>{card}</Link>;
}

export default function DashboardPage() {
  const [summary, setSummary] =
    useState<DashboardSummary>(emptySummary);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/dashboard/summary");

      setSummary(response.data.data ?? emptySummary);
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard summary.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const funnelCards = [
    {
      label: "Total Leads",
      value: summary.leadFunnel.totalLeads,
      helper: "New prospects waiting for action",
      href: "/leads",
    },
    {
      label: "Visited Parties",
      value: summary.leadFunnel.visitedParties,
      helper: "Visit report submitted",
      href: "/leads",
    },
    {
      label: "Potential Customers",
      value: summary.leadFunnel.potentialCustomers,
      helper: "Qualified after visit",
      href: "/leads",
    },
    {
      label: "High Potential",
      value: summary.leadFunnel.highPotentialCustomers,
      helper: "Priority conversion pipeline",
      href: "/leads",
    },
    {
      label: "Converted",
      value: summary.leadFunnel.convertedCustomers,
      helper: "Ready for onboarding",
      href: "/onboarding",
    },
    {
      label: "Customers Created",
      value: summary.leadFunnel.customersCreated,
      helper: "Created in BC-365",
      href: "/onboarding",
    },
  ];

  const approvalCards = [
    {
      label: "Pending Visit Plans",
      value: summary.visitPlans.pendingApproval,
      helper: "Visit plans awaiting HOD approval",
      href: "/visit-plans",
    },
    {
      label: "Approved Visit Plans",
      value: summary.visitPlans.approved,
      helper: "Approved field visits",
      href: "/visit-plans",
    },
    {
      label: "Pending Onboarding",
      value: summary.onboarding.pendingApproval,
      helper: "Customer onboarding approvals",
      href: "/approvals",
    },
    {
      label: "Ready for Review",
      value: summary.onboarding.readyForReview,
      helper: "OCR/GST/address completed",
      href: "/onboarding",
    },
    {
      label: "ERP Customers",
      value: summary.onboarding.customerCreated,
      helper: "Successfully synced customers",
      href: "/onboarding",
    },
    {
      label: "All Pending Approvals",
      value: summary.approvals.pending,
      helper: "Open approval records",
      href: "/approvals",
    },
  ];

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Sales Dashboard"
          description="Live view of acquisition, visit planning, onboarding, approvals, and ERP customer creation."
          action={
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="btn-secondary"
            >
              Refresh
            </button>
          }
        />

        {isLoading && (
          <div className="app-card p-6 text-sm text-muted">
            Loading dashboard...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-danger bg-red-50 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-8">
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Lead Funnel
                </h2>
                <p className="text-sm text-muted">
                  Track customers from lead creation to BC-365 customer creation.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {funnelCards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Approvals & Onboarding
                </h2>
                <p className="text-sm text-muted">
                  Monitor HOD approvals, onboarding readiness, and ERP sync progress.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {approvalCards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </div>
            </section>

            <section className="app-card p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Recent Activities
                  </h2>
                  <p className="text-sm text-muted">
                    Latest visit, note, and follow-up activity captured in the system.
                  </p>
                </div>

                <Link href="/leads" className="btn-secondary">
                  View Leads
                </Link>
              </div>

              {summary.recentActivities.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted">
                  No recent activities found.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.recentActivities.map((activity) => (
                    <div
                      key={activity._id}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {activity.type}
                          </p>

                          <p className="mt-1 text-sm text-muted">
                            {activity.summary ?? "No summary available"}
                          </p>

                          {activity.outcome && (
                            <p className="mt-2 text-sm text-muted">
                              Outcome:{" "}
                              <span className="text-foreground">
                                {activity.outcome}
                              </span>
                            </p>
                          )}
                        </div>

                        <p className="text-sm text-muted">
                          {formatDate(
                            activity.activityAt ?? activity.createdAt,
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}