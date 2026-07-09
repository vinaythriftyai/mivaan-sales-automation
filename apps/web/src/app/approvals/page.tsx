"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { labelFromEnum } from "@/lib/status-colors";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse } from "@/types";

type Approval = {
  _id: string;
  entityType: "VISIT_PLAN" | "ONBOARDING";
  entityId: string;
  status: string;
  requestedAt: string;
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<Approval[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get<ApiResponse<Approval[]>>("/approvals/my-pending");
      setItems(r.data.data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to load approvals"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function decide(item: Approval, decision: "approve" | "reject") {
    const reason = reasons[item._id] ?? "";

    if (decision === "reject" && !reason.trim()) {
      setError("A rejection reason is required");
      return;
    }

    try {
      setError("");

      const base =
        item.entityType === "VISIT_PLAN"
          ? `/visit-plans/${item.entityId}`
          : `/onboarding/${item.entityId}`;

      const body = decision === "reject" ? { reason: reason.trim() } : {};

      await api.post(`${base}/${decision}`, body);

      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, `Unable to ${decision}`));
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Pending Approvals"
        description="Review Visit Plans and customer onboarding requests assigned to you."
      />
      {error && <div className="error-banner mb-5">{error}</div>}
      {loading ? (
        <div className="app-card p-10 text-center text-text-muted">
          Loading approvals...
        </div>
      ) : items.length === 0 ? (
        <div className="app-card p-10 text-center text-text-muted">
          No pending approvals.
        </div>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => (
            <article key={item._id} className="app-card p-6">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-text-muted">
                    {labelFromEnum(item.entityType)}
                  </p>
                  <p className="mt-1 font-bold">Reference: {item.entityId}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <textarea
                rows={3}
                className="textarea-field mt-5"
                placeholder="Decision note or rejection reason"
                value={reasons[item._id] ?? ""}
                onChange={(e) =>
                  setReasons({ ...reasons, [item._id]: e.target.value })
                }
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => void decide(item, "reject")}
                  className="btn-danger"
                >
                  Reject
                </button>
                <button
                  onClick={() => void decide(item, "approve")}
                  className="btn-primary bg-success"
                >
                  Approve
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
