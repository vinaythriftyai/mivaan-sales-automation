"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PartyTable } from "@/components/PartyTable";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { Party, PartyListResponse } from "@/types";

export default function LeadsPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await api.get<PartyListResponse>("/parties", { params: { page: 1, pageSize: 100, search: search || undefined, status: status || undefined } });
      setParties(response.data.data);
    } catch (e) { setError(getApiErrorMessage(e, "Unable to load Lead Register")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function submit(e: FormEvent) { e.preventDefault(); void load(); }

  return <AppShell>
    <PageHeader title="Lead Register" description="Central storage for prospects, potential customers, converted customers, and existing accounts." actions={<Link href="/leads/new" className="btn-primary">Add Prospect</Link>} />
    <form onSubmit={submit} className="app-card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
      <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, mobile, email or GSTIN" />
      <select className="select-field" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="LEAD">Lead</option><option value="PLANNED">Planned</option><option value="VISITED">Visited</option><option value="POTENTIAL">Potential</option><option value="HIGH_POTENTIAL">High Potential</option><option value="CONVERTED">Converted</option><option value="CUSTOMER">Customer</option><option value="NOT_INTERESTED">Not Interested</option></select>
      <button className="btn-primary">Search</button>
    </form>
    {error && <div className="error-banner mb-5">{error}</div>}
    <PartyTable parties={parties} loading={loading} />
  </AppShell>;
}
