"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate, labelFromEnum } from "@/lib/status-colors";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, OnboardingRequest } from "@/types";

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRequest[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const r = await api.get<ApiResponse<OnboardingRequest[]>>("/onboarding", { params: { status: status || undefined } }); setRecords(r.data.data); }
    catch (e) { setError(getApiErrorMessage(e, "Unable to load onboarding requests")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  return <AppShell>
    <PageHeader title="Customer Onboarding" description="Verify GST data, select the customer-master address, obtain HOD approval, and create the customer in BC-365." />
    <div className="app-card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-text-muted">{records.length} onboarding request(s)</p><div className="flex gap-3"><select className="select-field" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PENDING_APPROVAL">Pending Approval</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="CUSTOMER_CREATED">Customer Created</option><option value="SYNC_FAILED">Sync Failed</option></select><button onClick={() => void load()} className="btn-secondary">Apply</button></div></div>
    {error && <div className="error-banner mb-5">{error}</div>}
    <div className="table-shell overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Request</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">GST</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3" /></tr></thead><tbody>{records.map((r) => <tr key={r._id} className="border-b border-border hover:bg-surface-muted/60 last:border-b-0"><td className="px-4 py-4 font-semibold">{r.onboardingNumber}</td><td className="px-4 py-4"><p className="font-semibold">{r.customerName}</p><p className="mt-1 text-xs text-text-muted">{r.mobile}</p></td><td className="px-4 py-4">{labelFromEnum(r.source)}</td><td className="px-4 py-4">{r.gstin ?? "—"}</td><td className="px-4 py-4"><StatusBadge status={r.status} /></td><td className="px-4 py-4 text-text-muted">{formatDate(r.createdAt)}</td><td className="px-4 py-4"><Link href={`/onboarding/${r._id}`} className="font-semibold text-primary">Open</Link></td></tr>)}{!loading && records.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-text-muted">No onboarding requests.</td></tr>}</tbody></table>{loading && <div className="p-10 text-center text-text-muted">Loading onboarding...</div>}</div>
  </AppShell>;
}
