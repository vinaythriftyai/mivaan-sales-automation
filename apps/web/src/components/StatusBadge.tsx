import { labelFromEnum, statusColor } from "@/lib/status-colors";
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor(status)}`}>{labelFromEnum(status)}</span>;
}
