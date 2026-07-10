"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/PageHeader";
import { RegisterToolbar } from "@/components/RegisterToolbar";
import { api } from "@/lib/api";
import { exportCsv } from "@/lib/export-csv";
import type { RegisterActivity } from "@/types/registers";

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getParty(activity: RegisterActivity) {
  if (!activity.partyId || typeof activity.partyId === "string") {
    return null;
  }

  return activity.partyId;
}

function includesSearch(record: RegisterActivity, search: string) {
  const value = search.toLowerCase().trim();

  if (!value) return true;

  const party = getParty(record);

  return [
    record.type,
    record.summary,
    record.outcome,
    party?.companyName,
    party?.mobile,
    party?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(value);
}

function getFollowUpBucket(value?: string) {
  if (!value) return "NO_DATE";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUpDate = new Date(value);
  followUpDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(followUpDate.getTime())) {
    return "NO_DATE";
  }

  if (followUpDate < today) return "OVERDUE";

  if (followUpDate.getTime() === today.getTime()) {
    return "TODAY";
  }

  return "UPCOMING";
}

export default function FollowUpsPage() {
  const [records, setRecords] = useState<RegisterActivity[]>([]);
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/registers/follow-ups");

      setRecords(response.data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load follow-up register.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = includesSearch(record, search);

      const matchesBucket = bucket
        ? getFollowUpBucket(record.nextFollowUpAt) === bucket
        : true;

      return matchesSearch && matchesBucket;
    });
  }, [records, search, bucket]);

  function exportRecords() {
    exportCsv(
      "follow-up-register.csv",
      filteredRecords.map((record) => {
        const party = getParty(record);

        return {
          followUpDate: formatDate(record.nextFollowUpAt),
          followUpBucket: getFollowUpBucket(record.nextFollowUpAt),
          customerName: party?.companyName,
          customerMobile: party?.mobile,
          customerStatus: party?.status,
          activityType: record.type,
          summary: record.summary,
          outcome: record.outcome,
        };
      }),
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Follow-up Register"
          description="Upcoming customer follow-ups generated from visits and activities."
          actions={
            <button onClick={() => void loadRecords()} className="btn-secondary">
              Refresh
            </button>
          }
        />

        <RegisterToolbar
          search={search}
          onSearchChange={setSearch}
          status={bucket}
          onStatusChange={setBucket}
          statusOptions={["OVERDUE", "TODAY", "UPCOMING"]}
          searchPlaceholder="Search customer, mobile, activity, summary..."
          filterPlaceholder="All follow-ups"
          onExport={exportRecords}
        />

        {isLoading && (
          <div className="app-card p-6 text-sm text-muted">Loading...</div>
        )}

        {error && (
          <div className="rounded-xl border border-danger bg-red-50 p-4 text-sm text-danger">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <section className="app-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-muted">
                <tr>
                  <th className="p-4">Follow-up Date</th>
                  <th className="p-4">Bucket</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Summary</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => {
                  const party = getParty(record);
                  const followUpBucket = getFollowUpBucket(
                    record.nextFollowUpAt,
                  );

                  return (
                    <tr key={record._id} className="border-b border-border">
                      <td className="p-4 font-semibold text-warning">
                        {formatDate(record.nextFollowUpAt)}
                      </td>

                      <td className="p-4 text-muted">
                        {followUpBucket}
                      </td>

                      <td className="p-4 text-muted">
                        {party?.companyName ?? "-"}
                      </td>

                      <td className="p-4 text-muted">
                        {party?.mobile ?? "-"}
                      </td>

                      <td className="p-4 text-muted">
                        {record.summary ?? "-"}
                      </td>

                      <td className="p-4">
                        {party?._id ? (
                          <Link
                            href={`/leads/${party._id}`}
                            className="btn-secondary"
                          >
                            Open
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted">
                      No follow-ups found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </AppShell>
    </AuthGuard>
  );
}