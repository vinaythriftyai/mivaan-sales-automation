const colors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  LEAD: "bg-slate-100 text-slate-700 border-slate-200",
  PLANNED: "bg-sky-100 text-sky-800 border-sky-200",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  VISITED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  POTENTIAL: "bg-cyan-100 text-cyan-800 border-cyan-200",
  HIGH_POTENTIAL: "bg-violet-100 text-violet-800 border-violet-200",
  CONVERTED: "bg-green-100 text-green-800 border-green-200",
  CUSTOMER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NOT_INTERESTED: "bg-slate-100 text-slate-600 border-slate-200",
  CUSTOMER_CREATED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SYNC_FAILED: "bg-red-100 text-red-800 border-red-200"
};
export function statusColor(status: string) { return colors[status] ?? colors.DRAFT; }
export function labelFromEnum(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }
export function formatDate(value?: string) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d); }
