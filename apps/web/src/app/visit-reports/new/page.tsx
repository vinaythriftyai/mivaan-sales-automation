"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { InputField, SelectField, TextAreaField } from "@/components/FormControls";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse } from "@/types";

export default function NewVisitReportPage() {
  const router = useRouter();
  const search = useSearchParams();
  const visitPlanId = search.get("visitPlanId") ?? "";
  const visitPlanItemId = search.get("visitPlanItemId") ?? "";
  const partyId = search.get("partyId") ?? "";
  const [form, setForm] = useState({ visitedAt: "", contactPerson: "", customerType: "", productCategory: "", products: "", qtyApproxMt: "", productFit: "true", seriousness: "UNKNOWN", expectedDemand: "", outcomeSummary: "", remarks: "", nextFollowUpAt: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((x) => ({ ...x, [field]: value }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const user = getStoredUser(); if (!user) throw new Error("Current user is unavailable");
      if (!visitPlanId || !visitPlanItemId || !partyId) throw new Error("Visit Plan, plan item, and party IDs are required");
      const r = await api.post<ApiResponse<{ _id: string }>>("/visit-reports", {
        visitPlanId, visitPlanItemId, partyId, camId: user.id,
        visitedAt: form.visitedAt,
        contactPerson: form.contactPerson || undefined,
        customerType: form.customerType,
        productCategory: form.productCategory,
        products: form.products.split(",").map((x) => x.trim()).filter(Boolean),
        qtyApproxMt: form.qtyApproxMt ? Number(form.qtyApproxMt) : undefined,
        productFit: form.productFit === "true",
        seriousness: form.seriousness,
        expectedDemand: form.expectedDemand || undefined,
        outcomeSummary: form.outcomeSummary,
        remarks: form.remarks || undefined,
        nextFollowUpAt: form.nextFollowUpAt || undefined
      });
      router.push(`/leads/${partyId}`);
    } catch (e) { setError(getApiErrorMessage(e, "Unable to save Visit Report")); }
    finally { setSubmitting(false); }
  }

  return <AppShell>
    <PageHeader title="Submit Visit Report" description="Record the visit outcome, customer requirement, product fit, and next follow-up." actions={<Link href={`/visit-plans/${visitPlanId}`} className="btn-secondary">Back to Plan</Link>} />
    <form onSubmit={submit} className="app-card space-y-6 p-6">
      {error && <div className="error-banner">{error}</div>}
      <div className="grid gap-5 md:grid-cols-2"><InputField label="Visited At" type="datetime-local" required value={form.visitedAt} onChange={(e) => update("visitedAt", e.target.value)} /><InputField label="Contact Person" value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} /><InputField label="Customer Type" required value={form.customerType} onChange={(e) => update("customerType", e.target.value)} /><InputField label="Product Category" required value={form.productCategory} onChange={(e) => update("productCategory", e.target.value)} /><InputField label="Products" value={form.products} onChange={(e) => update("products", e.target.value)} help="Separate multiple products with commas." /><InputField label="Approximate Quantity (MT)" type="number" min="0" value={form.qtyApproxMt} onChange={(e) => update("qtyApproxMt", e.target.value)} /><SelectField label="Product Fit" required value={form.productFit} onChange={(e) => update("productFit", e.target.value)} options={[{ label: "Yes", value: "true" }, { label: "No", value: "false" }]} /><SelectField label="Seriousness" value={form.seriousness} onChange={(e) => update("seriousness", e.target.value)} options={[{ label: "Unknown", value: "UNKNOWN" }, { label: "Low", value: "LOW" }, { label: "Medium", value: "MEDIUM" }, { label: "High", value: "HIGH" }]} /><InputField label="Next Follow-up" type="date" value={form.nextFollowUpAt} onChange={(e) => update("nextFollowUpAt", e.target.value)} /></div>
      <TextAreaField label="Expected Demand" rows={3} value={form.expectedDemand} onChange={(e) => update("expectedDemand", e.target.value)} /><TextAreaField label="Visit Outcome Summary" required rows={5} value={form.outcomeSummary} onChange={(e) => update("outcomeSummary", e.target.value)} /><TextAreaField label="Remarks" rows={4} value={form.remarks} onChange={(e) => update("remarks", e.target.value)} />
      <div className="flex justify-end"><button disabled={submitting} className="btn-primary">{submitting ? "Saving..." : "Save Visit Report"}</button></div>
    </form>
  </AppShell>;
}
