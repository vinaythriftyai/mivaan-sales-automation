"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, labelFromEnum } from "@/lib/status-colors";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, Party } from "@/types";
import { PartyActivityTimeline } from "@/components/PartyActivityTimeline";
export default function LeadDetailPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const [party, setParty] = useState<Party | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<ApiResponse<Party>>(`/parties/${partyId}`);
      setParty(r.data.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to load party"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [partyId]);

  async function action(name: string, label: string) {
    if (!reason.trim()) {
      setError("Enter a decision reason first.");
      return;
    }
    try {
      setError("");
      setSuccess("");
      await api.post(`/parties/${partyId}/${name}`, { reason: reason.trim() });
      setSuccess(`${label} completed.`);
      setReason("");
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, `Unable to ${label.toLowerCase()}`));
    }
  }

  if (loading)
    return (
      <AppShell>
        <div className="app-card p-10 text-center text-text-muted">
          Loading party details...
        </div>
      </AppShell>
    );
  if (!party)
    return (
      <AppShell>
        <div className="error-banner">{error || "Party not found"}</div>
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader
        title={party.companyName}
        description="Lead profile, visit planning, qualification decisions, and onboarding readiness."
        actions={
          <>
            <Link href="/leads" className="btn-secondary">
              Back
            </Link>

            <Link
              href={`/leads/${party._id}/add-activity`}
              className="btn-secondary"
            >
              Add Activity / Follow-up
            </Link>

            <Link
              href={`/visit-plans/new?partyId=${party._id}`}
              className="btn-primary"
            >
              Plan Visit
            </Link>
          </>
        }
      />
      {error && <div className="error-banner mb-5">{error}</div>}
      {success && <div className="success-banner mb-5">{success}</div>}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="app-card p-6">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-sm text-text-muted">Current Status</p>
              <div className="mt-2">
                <StatusBadge status={party.status} />
              </div>
            </div>
            {party.erpCustomerCode && (
              <div>
                <p className="text-xs text-text-muted">ERP Customer</p>
                <p className="font-bold">{party.erpCustomerCode}</p>
              </div>
            )}
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Mobile", party.mobile],
              ["Email", party.email ?? "—"],
              ["Source", labelFromEnum(party.source)],
              ["Customer Type", party.customerType],
              ["Product Category", party.productCategory],
              [
                "Quantity",
                party.qtyApproxMt !== undefined
                  ? `${party.qtyApproxMt} MT`
                  : "—",
              ],
              ["Area", party.area ?? "—"],
              ["City", party.city ?? "—"],
              ["GSTIN", party.gstin ?? "—"],
              ["Next Follow-up", formatDate(party.nextFollowUpAt)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {l}
                </p>
                <p className="mt-1 text-sm font-medium">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <p className="font-semibold">Remarks</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-muted">
              {party.remarks || "No remarks."}
            </p>
          </div>
        </section>
        <aside className="app-card h-fit p-6">
          <h2 className="font-bold">Qualification Decision</h2>
          <p className="mt-1 text-sm text-text-muted">
            Record evidence before changing status.
          </p>
          <textarea
            className="textarea-field mt-4"
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Product fit, demand, seriousness, or rejection reason"
          />
          <div className="mt-4 grid gap-3">
            <button
              onClick={() => void action("mark-potential", "Mark Potential")}
              className="btn-primary"
            >
              Mark Potential
            </button>
            <button
              onClick={() =>
                void action("mark-high-potential", "Mark High Potential")
              }
              className="btn-secondary"
            >
              Mark High Potential
            </button>
            <button
              onClick={() => void action("convert", "Convert Customer")}
              className="btn-secondary border-success text-success"
            >
              Convert Customer
            </button>
            <button
              onClick={() =>
                void action("mark-not-interested", "Mark Not Interested")
              }
              className="btn-secondary border-danger text-danger"
            >
              Mark Not Interested
            </button>
          </div>
        </aside>
      </div>
      <div className="mt-5">
        <PartyActivityTimeline partyId={party._id} />
      </div>
    </AppShell>
  );
}
