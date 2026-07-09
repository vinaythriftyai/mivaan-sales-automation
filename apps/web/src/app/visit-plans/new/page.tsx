"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { InputField } from "@/components/FormControls";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, Party, PartyListResponse, VisitPlan } from "@/types";

type Item = { partyId: string; remarks: string };

export default function NewVisitPlanPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [parties, setParties] = useState<Party[]>([]);
  const [form, setForm] = useState({ division: "", dateFrom: "", dateTo: "", area: "", city: "" });
  const [items, setItems] = useState<Item[]>([{ partyId: search.get("partyId") ?? "", remarks: "" }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser(); setForm((x) => ({ ...x, division: user?.division ?? "" }));
    api.get<PartyListResponse>("/parties", { params: { page: 1, pageSize: 100 } }).then((r) => setParties(r.data.data)).catch((e) => setError(getApiErrorMessage(e, "Unable to load parties")));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      const user = getStoredUser(); if (!user) throw new Error("Current user is unavailable");
      const selected = items.filter((i) => i.partyId); if (!selected.length) throw new Error("Add at least one customer");
      const response = await api.post<ApiResponse<VisitPlan>>("/visit-plans", {
        ...form,
        camId: user.id,
        items: selected.map((i) => {
          const p = parties.find((x) => x._id === i.partyId); if (!p) throw new Error("Selected party was not found");
          return { partyId: p._id, partySource: p.source, customerNameSnapshot: p.companyName, productRange: p.products ?? [], dispatchQtyLastThreeMonthsMt: 0, remarks: i.remarks || undefined };
        })
      });
      router.push(`/visit-plans/${response.data.data._id}`);
    } catch (e) { setError(getApiErrorMessage(e, "Unable to create Visit Plan")); }
    finally { setSubmitting(false); }
  }

  return <AppShell>
    <PageHeader title="Create Visit Plan" description="Plan approved customer visits by date, territory, and party source." actions={<Link href="/visit-plans" className="btn-secondary">Back</Link>} />
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="error-banner">{error}</div>}
      <section className="app-card p-6"><h2 className="font-bold">Plan Information</h2><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3"><InputField label="Division" required value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} /><InputField label="Date From" type="date" required value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} /><InputField label="Date To" type="date" required value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} /><InputField label="Area" required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /><InputField label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div></section>
      <section className="app-card p-6"><div className="flex justify-between"><div><h2 className="font-bold">Planned Customer Visits</h2><p className="mt-1 text-sm text-text-muted">Add one or more parties.</p></div><button type="button" onClick={() => setItems([...items, { partyId: "", remarks: "" }])} className="btn-secondary">Add Party</button></div><div className="mt-5 space-y-4">{items.map((item, index) => <div key={index} className="rounded-xl border border-border bg-surface-muted/50 p-4"><div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]"><div><label className="field-label">Customer</label><select required className="select-field" value={item.partyId} onChange={(e) => setItems(items.map((x, i) => i === index ? { ...x, partyId: e.target.value } : x))}><option value="">Select customer</option>{parties.map((p) => <option key={p._id} value={p._id}>{p.companyName}</option>)}</select></div><InputField label="Remarks" value={item.remarks} onChange={(e) => setItems(items.map((x, i) => i === index ? { ...x, remarks: e.target.value } : x))} /><button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))} className="btn-secondary self-end text-danger">Remove</button></div></div>)}</div></section>
      <div className="flex justify-end gap-3"><Link href="/visit-plans" className="btn-secondary">Cancel</Link><button disabled={submitting} className="btn-primary">{submitting ? "Creating..." : "Save Visit Plan"}</button></div>
    </form>
  </AppShell>;
}
