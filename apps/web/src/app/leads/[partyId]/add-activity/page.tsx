"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/get-api-error";
const activityTypes = [
  "PHONE_CALL",
  "EMAIL",
  "WHATSAPP",
  "OFFER",
  "PRICE_COMMUNICATION",
  "NOTE",
];

export default function AddActivityPage() {
  const params = useParams<{ partyId: string }>();
  const router = useRouter();

  const partyId = params.partyId;

  const [type, setType] = useState("PHONE_CALL");
  const [activityAt, setActivityAt] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");

      await api.post("/activities", {
        partyId,
        type,
        activityAt: activityAt ? new Date(activityAt).toISOString() : undefined,
        summary,
        outcome: outcome || undefined,
        nextFollowUpAt: nextFollowUpAt
          ? new Date(nextFollowUpAt).toISOString()
          : undefined,
      });

      router.push(`/leads/${partyId}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save activity"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Add Activity"
          description="Create a manual customer activity or follow-up record."
        />

        <form
          onSubmit={submitActivity}
          className="app-card max-w-3xl space-y-5 p-6"
        >
          {error && (
            <div className="rounded-xl border border-danger bg-red-50 p-4 text-sm text-danger">
              {error}
            </div>
          )}

          <div>
            <label className="form-label">Activity Type</label>
            <select
              className="select-field"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {activityTypes.map((activityType) => (
                <option key={activityType} value={activityType}>
                  {activityType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Activity Date & Time</label>
            <input
              type="datetime-local"
              className="input-field"
              value={activityAt}
              onChange={(event) => setActivityAt(event.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Summary</label>
            <textarea
              className="textarea-field"
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Example: Called purchase manager to discuss repeat order requirement."
              required
            />
          </div>

          <div>
            <label className="form-label">Outcome</label>
            <textarea
              className="textarea-field"
              rows={4}
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="Example: Customer requested updated quotation for beams and channels."
            />
          </div>

          <div>
            <label className="form-label">Next Follow-up Date & Time</label>
            <input
              type="datetime-local"
              className="input-field"
              value={nextFollowUpAt}
              onChange={(event) => setNextFollowUpAt(event.target.value)}
            />
            <p className="mt-2 text-xs text-muted">
              Optional. If set, this activity will appear in the Follow-up
              Register.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? "Saving..." : "Save Activity"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </AppShell>
    </AuthGuard>
  );
}
