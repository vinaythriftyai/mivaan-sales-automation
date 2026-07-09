import Link from "next/link";
import { labelFromEnum } from "@/lib/status-colors";
import type { Party } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function PartyTable({ parties, loading = false }: { parties: Party[]; loading?: boolean }) {
  return (
    <div className="table-shell overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="table-head"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Quantity</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
        <tbody>
          {parties.map((p) => <tr key={p._id} className="border-b border-border hover:bg-surface-muted/60 last:border-b-0"><td className="px-4 py-4"><p className="font-semibold">{p.companyName}</p><p className="mt-1 text-xs text-text-muted">{p.mobile}</p></td><td className="px-4 py-4 text-text-muted">{labelFromEnum(p.source)}</td><td className="px-4 py-4">{p.customerType}</td><td className="px-4 py-4">{p.productCategory}</td><td className="px-4 py-4">{p.qtyApproxMt !== undefined ? `${p.qtyApproxMt} MT` : "—"}</td><td className="px-4 py-4 text-text-muted">{[p.area, p.city].filter(Boolean).join(", ") || "—"}</td><td className="px-4 py-4"><StatusBadge status={p.status} /></td><td className="px-4 py-4"><Link href={`/leads/${p._id}`} className="font-semibold text-primary hover:text-primary-hover">View</Link></td></tr>)}
          {!loading && parties.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-text-muted">No records found.</td></tr>}
        </tbody>
      </table>
      {loading && <div className="p-10 text-center text-sm text-text-muted">Loading records...</div>}
    </div>
  );
}
