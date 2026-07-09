"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error";

type PartyActivity = {
  _id: string;
  type: string;
  summary?: string;
  outcome?: string;
  activityAt?: string;
  nextFollowUpAt?: string;
  createdAt?: string;
};

type PartyActivityTimelineProps = {
  partyId: string;
};

function formatDateTime(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityType(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActivityTone(type: string) {
  if (type === "VISIT") return "border-primary bg-blue-50 text-primary";
  if (type === "PHONE_CALL") return "border-info bg-sky-50 text-info";
  if (type === "WHATSAPP") return "border-success bg-green-50 text-success";
  if (type === "EMAIL") return "border-accent bg-cyan-50 text-accent";
  if (type === "OFFER") return "border-warning bg-orange-50 text-warning";
  if (type === "PRICE_COMMUNICATION") {
    return "border-warning bg-orange-50 text-warning";
  }

  return "border-border bg-surface-muted text-foreground";
}

export function PartyActivityTimeline({ partyId }: PartyActivityTimelineProps) {
  const [activities, setActivities] = useState<PartyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadActivities() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/activities/party/${partyId}`);

      setActivities(response.data.data ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load activities"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (partyId) {
      void loadActivities();
    }
  }, [partyId]);

  return (
    <section className="app-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Activity Timeline</h2>
          <p className="mt-1 text-sm text-text-muted">
            Calls, WhatsApp messages, offers, notes, visits, and follow-ups for
            this customer.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void loadActivities()}
            className="btn-secondary"
          >
            Refresh
          </button>

          <Link href={`/leads/${partyId}/add-activity`} className="btn-primary">
            Add Activity
          </Link>
        </div>
      </div>

      {loading && (
        <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4 text-sm text-text-muted">
          Loading customer activity...
        </div>
      )}

      {error && <div className="error-banner mt-5">{error}</div>}

      {!loading && !error && activities.length === 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4 text-sm text-text-muted">
          No activities recorded yet.
        </div>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="mt-6 space-y-4">
          {activities.map((activity) => {
            const tone = getActivityTone(activity.type);

            return (
              <div
                key={activity._id}
                className="rounded-2xl border border-border bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${tone}`}
                    >
                      {formatActivityType(activity.type)}
                    </span>

                    <p className="mt-3 font-semibold text-foreground">
                      {activity.summary || "No summary available"}
                    </p>

                    {activity.outcome && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-muted">
                        {activity.outcome}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Activity Date
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDateTime(
                        activity.activityAt ?? activity.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                {activity.nextFollowUpAt && (
                  <div className="mt-4 rounded-xl border border-warning bg-orange-50 px-4 py-3 text-sm text-warning">
                    <span className="font-semibold">Next Follow-up:</span>{" "}
                    {formatDateTime(activity.nextFollowUpAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
