"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { AuditEvent } from "@/types/audit";

type AuditTimelineProps = {
  entityType: string;
  entityId: string;
  title?: string;
};

function formatDate(value?: string) {
  if (!value) return "Time not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time not available";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusChange(event: AuditEvent) {
  const oldStatus =
    typeof event.oldValue?.status === "string"
      ? event.oldValue.status
      : undefined;

  const newStatus =
    typeof event.newValue?.status === "string"
      ? event.newValue.status
      : undefined;

  if (!oldStatus && !newStatus) {
    return null;
  }

  if (oldStatus && newStatus) {
    return `${oldStatus} → ${newStatus}`;
  }

  return newStatus ?? oldStatus ?? null;
}

function getCustomerCode(event: AuditEvent) {
  const metadataCode =
    typeof event.metadata?.customerCode === "string"
      ? event.metadata.customerCode
      : undefined;

  const erpSync = event.newValue?.erpSync as
    | { customerCode?: string }
    | undefined;

  return metadataCode ?? erpSync?.customerCode;
}

export function AuditTimeline({
  entityType,
  entityId,
  title = "Audit Timeline",
}: AuditTimelineProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTimeline() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get(
        `/audit/entity/${entityType}/${entityId}`,
      );

      setEvents(response.data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load audit timeline.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (entityType && entityId) {
      void loadTimeline();
    }
  }, [entityType, entityId]);

  return (
    <section className="app-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Complete history of actions performed on this record.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTimeline()}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted">
          Loading audit timeline...
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-danger bg-red-50 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4 text-sm text-muted">
          No audit events found for this record.
        </div>
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="mt-6 space-y-4">
          {events.map((event) => {
            const statusChange = getStatusChange(event);
            const customerCode = getCustomerCode(event);

            return (
              <div
                key={event._id}
                className="relative rounded-2xl border border-border bg-white p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatAction(event.action)}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      Actor Role:{" "}
                      <span className="font-medium text-foreground">
                        {event.actorRole ?? "Unknown"}
                      </span>
                    </p>
                  </div>

                  <p className="text-sm text-muted">
                    {formatDate(event.createdAt ?? event.updatedAt)}
                  </p>
                </div>

                {statusChange && (
                  <div className="mt-3 rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm">
                    <span className="text-muted">Status:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {statusChange}
                    </span>
                  </div>
                )}

                {customerCode && (
                  <div className="mt-3 rounded-xl border border-success bg-green-50 px-3 py-2 text-sm text-success">
                    Customer Code:{" "}
                    <span className="font-semibold">
                      {customerCode}
                    </span>
                  </div>
                )}

                {typeof event.metadata?.reason === "string" && (
                  <p className="mt-3 text-sm text-muted">
                    Reason:{" "}
                    <span className="text-foreground">
                      {event.metadata.reason}
                    </span>
                  </p>
                )}

                {typeof event.metadata?.comment === "string" && (
                  <p className="mt-3 text-sm text-muted">
                    Comment:{" "}
                    <span className="text-foreground">
                      {event.metadata.comment}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}