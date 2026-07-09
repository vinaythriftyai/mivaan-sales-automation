"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatDate } from "@/lib/status-colors";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, VisitPlan } from "@/types";
import { AuditTimeline } from "@/components/AuditTimeline";
export default function VisitPlanDetailPage() {
  const { visitPlanId } = useParams<{ visitPlanId: string }>();
  const user = getStoredUser();
  const [plan, setPlan] = useState<VisitPlan | null>(null);
  const [approverId, setApproverId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<ApiResponse<VisitPlan>>(
        `/visit-plans/${visitPlanId}`,
      );
      setPlan(r.data.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to load Visit Plan"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [visitPlanId]);
  async function run(path: string, body: unknown, message: string) {
    try {
      setError("");
      setSuccess("");
      await api.post(`/visit-plans/${visitPlanId}/${path}`, body);
      setSuccess(message);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }

  if (loading)
    return (
      <AppShell>
        <div className="app-card p-10 text-center text-text-muted">
          Loading Visit Plan...
        </div>
      </AppShell>
    );
  if (!plan)
    return (
      <AppShell>
        <div className="error-banner">{error || "Visit Plan not found"}</div>
      </AppShell>
    );
  const canApprove = user?.role === "HOD" || user?.role === "SYSTEM_ADMIN";

  return (
    <AppShell>
      <PageHeader
        title={plan.planNumber}
        description="Visit Plan details, approval status, and field execution controls."
        actions={
          <Link href="/visit-plans" className="btn-secondary">
            Back
          </Link>
        }
      />
      {error && <div className="error-banner mb-5">{error}</div>}
      {success && <div className="success-banner mb-5">{success}</div>}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="app-card p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-text-muted">Current Status</p>
                <div className="mt-2">
                  <StatusBadge status={plan.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">CAM</p>
                <p className="font-semibold">
                  {typeof plan.camId === "string"
                    ? plan.camId
                    : plan.camId.name}
                </p>
              </div>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Division", plan.division],
                ["Date From", formatDate(plan.dateFrom)],
                ["Date To", formatDate(plan.dateTo)],
                ["Area", `${plan.area}, ${plan.city}`],
                ["Customers", String(plan.items.length)],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs uppercase text-text-muted">{l}</p>
                  <p className="mt-1 text-sm font-medium">{v}</p>
                </div>
              ))}
            </div>
            {plan.rejectionReason && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {plan.rejectionReason}
              </div>
            )}
          </section>
          <section className="app-card overflow-hidden">
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-bold">Planned Customers</h2>
            </div>
            {plan.items.map((item, index) => {
              const p = typeof item.partyId === "string" ? null : item.partyId;
              return (
                <div
                  key={item._id ?? index}
                  className="border-b border-border p-6 last:border-b-0"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">
                        {item.customerNameSnapshot}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        {item.partySource.replaceAll("_", " ")}
                      </p>
                    </div>
                    {p && (
                      <Link
                        href={`/leads/${p._id}`}
                        className="text-sm font-semibold text-primary"
                      >
                        Open Lead
                      </Link>
                    )}
                  </div>
                  {item.remarks && (
                    <p className="mt-3 text-sm text-text-muted">
                      {item.remarks}
                    </p>
                  )}
                  {plan.status === "APPROVED" && (
                    <Link
                      href={`/visit-reports/new?visitPlanId=${plan._id}&visitPlanItemId=${item._id ?? ""}&partyId=${p?._id ?? (typeof item.partyId === "string" ? item.partyId : "")}`}
                      className="btn-secondary mt-4"
                    >
                      Submit Visit Report
                    </Link>
                  )}
                </div>
              );
            })}
          </section>
        </div>
        <aside className="space-y-5">
          {plan.status === "DRAFT" && (
            <section className="app-card p-6">
              <h2 className="font-bold">Submit for Approval</h2>
              <p className="mt-1 text-sm text-text-muted">
                Enter the HOD user ID for the prototype.
              </p>
              <input
                className="input-field mt-4"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                placeholder="HOD user ID"
              />
              <button
                onClick={() =>
                  approverId.trim()
                    ? void run(
                        "submit",
                        { approverId: approverId.trim() },
                        "Visit Plan submitted.",
                      )
                    : setError("Enter approver ID")
                }
                className="btn-primary mt-4 w-full"
              >
                Submit Plan
              </button>
            </section>
          )}
          {plan.status === "SUBMITTED" && canApprove && (
            <section className="app-card p-6">
              <h2 className="font-bold">HOD Decision</h2>
              <button
                onClick={() =>
                  void run("approve", undefined, "Visit Plan approved.")
                }
                className="btn-primary mt-4 w-full bg-success"
              >
                Approve
              </button>
              <textarea
                rows={4}
                className="textarea-field mt-4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rejection reason"
              />
              <button
                onClick={() =>
                  reason.trim()
                    ? void run(
                        "reject",
                        { reason: reason.trim() },
                        "Visit Plan rejected.",
                      )
                    : setError("Enter rejection reason")
                }
                className="btn-danger mt-3 w-full"
              >
                Reject
              </button>
            </section>
          )}
        </aside>
        <AuditTimeline
          entityType="VISIT_PLAN"
          entityId={visitPlanId}
          title="Visit Plan Audit Timeline"
        />
      </div>
    </AppShell>
  );
}
