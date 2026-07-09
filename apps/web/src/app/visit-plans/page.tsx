"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/status-colors";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, VisitPlan } from "@/types";

export default function VisitPlansPage() {
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try { const r = await api.get<ApiResponse<VisitPlan[]>>("/visit-plans"); setPlans(r.data.data); }
      catch (e) { setError(getApiErrorMessage(e, "Unable to load Visit Plans")); }
      finally { setLoading(false); }
    })();
  }, []);

  const rows = useMemo(() => status ? plans.filter((p) => p.status === status) : plans, [plans, status]);

  return <AppShell>
    <PageHeader title="Visit Plans" description="Prepare CAM field visits, submit them for approval, and track execution readiness." actions={<Link href="/visit-plans/new" className="btn-primary">New Visit Plan</Link>} />
    <div className="app-card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-muted">{rows.length} plan(s)</p><select className="select-field max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="COMPLETED">Completed</option></select></div>
    {error && <div className="error-banner mb-5">{error}</div>}
    <div className="table-shell overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">CAM</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Parties</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead><tbody>{rows.map((p) => <tr key={p._id} className="border-b border-border hover:bg-surface-muted/60 last:border-b-0"><td className="px-4 py-4 font-semibold">{p.planNumber}</td><td className="px-4 py-4">{typeof p.camId === "string" ? p.camId : p.camId.name}</td><td className="px-4 py-4 text-text-muted">{formatDate(p.dateFrom)} – {formatDate(p.dateTo)}</td><td className="px-4 py-4">{p.area}, {p.city}</td><td className="px-4 py-4">{p.items.length}</td><td className="px-4 py-4"><StatusBadge status={p.status} /></td><td className="px-4 py-4"><Link href={`/visit-plans/${p._id}`} className="font-semibold text-primary">Open</Link></td></tr>)}{!loading && rows.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-text-muted">No Visit Plans found.</td></tr>}</tbody></table>{loading && <div className="p-10 text-center text-text-muted">Loading Visit Plans...</div>}</div>
  </AppShell>;
}
