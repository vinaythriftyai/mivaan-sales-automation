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

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function ActivitiesPage() {
  const [records, setRecords] = useState<RegisterActivity[]>([]);
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/registers/activities");

      setRecords(response.data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load activity register.");
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

      const matchesType = activityType ? record.type === activityType : true;

      return matchesSearch && matchesType;
    });
  }, [records, search, activityType]);

  function exportRecords() {
    exportCsv(
      "activity-register.csv",
      filteredRecords.map((record) => {
        const party = getParty(record);

        return {
          activityDate: formatDate(record.activityAt ?? record.createdAt),
          type: record.type,
          customerName: party?.companyName,
          customerMobile: party?.mobile,
          customerStatus: party?.status,
          summary: record.summary,
          outcome: record.outcome,
          nextFollowUpAt: formatDate(record.nextFollowUpAt),
        };
      }),
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        {/* <PageHeader
          title="Activity Register"
          description="All visit, note, follow-up, and customer activity records."
          action={
            <button onClick={() => void loadRecords()} className="btn-secondary">
              Refresh
            </button>
          }
        /> */}
        <PageHeader
          title="Activity Register"
          description="All visit, note, follow-up, and customer activity records."
          actions={
            <button
              onClick={() => void loadRecords()}
              className="btn-secondary"
            >
              Refresh
            </button>
          }
        />
        <RegisterToolbar
          search={search}
          onSearchChange={setSearch}
          status={activityType}
          onStatusChange={setActivityType}
          statusOptions={[
            "VISIT",
            "NOTE",
            "PHONE_CALL",
            "EMAIL",
            "WHATSAPP",
            "OFFER",
            "PRICE_COMMUNICATION",
          ]}
          searchPlaceholder="Search activity, customer, mobile, summary..."
          filterPlaceholder="All activity types"
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
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Summary</th>
                  <th className="p-4">Next Follow-up</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => {
                  const party = getParty(record);

                  return (
                    <tr key={record._id} className="border-b border-border">
                      <td className="p-4 text-muted">
                        {formatDate(record.activityAt ?? record.createdAt)}
                      </td>

                      <td className="p-4 font-semibold text-foreground">
                        {record.type}
                      </td>

                      <td className="p-4 text-muted">
                        {party?.companyName ?? "-"}
                      </td>

                      <td className="p-4 text-muted">
                        {record.summary ?? "-"}
                      </td>

                      <td className="p-4 text-muted">
                        {formatDate(record.nextFollowUpAt)}
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
                      No activities found.
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
