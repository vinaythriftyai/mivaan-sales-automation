"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { InputField } from "@/components/FormControls";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, Party, PartyListResponse, VisitPlan } from "@/types";

type Item = {
  partyId: string;
  remarks: string;
};

function NewVisitPlanPageContent() {
  const router = useRouter();
  const search = useSearchParams();

  const [parties, setParties] = useState<Party[]>([]);
  const [form, setForm] = useState({
    division: "",
    dateFrom: "",
    dateTo: "",
    area: "",
    city: "",
  });

  const [items, setItems] = useState<Item[]>([
    {
      partyId: search.get("partyId") ?? "",
      remarks: "",
    },
  ]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    setForm((currentForm) => ({
      ...currentForm,
      division: user?.division ?? "",
    }));

    api
      .get<PartyListResponse>("/parties", {
        params: {
          page: 1,
          pageSize: 100,
        },
      })
      .then((response) => setParties(response.data.data))
      .catch((err) =>
        setError(getApiErrorMessage(err, "Unable to load parties")),
      );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const user = getStoredUser();

      if (!user) {
        throw new Error("Current user is unavailable");
      }

      const selected = items.filter((item) => item.partyId);

      if (!selected.length) {
        throw new Error("Add at least one customer");
      }

      const response = await api.post<ApiResponse<VisitPlan>>("/visit-plans", {
        ...form,
        camId: user.id,
        items: selected.map((item) => {
          const party = parties.find((partyItem) => partyItem._id === item.partyId);

          if (!party) {
            throw new Error("Selected party was not found");
          }

          return {
            partyId: party._id,
            partySource: party.source,
            customerNameSnapshot: party.companyName,
            productRange: party.products ?? [],
            dispatchQtyLastThreeMonthsMt: 0,
            remarks: item.remarks || undefined,
          };
        }),
      });

      router.push(`/visit-plans/${response.data.data._id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create Visit Plan"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Create Visit Plan"
        description="Plan approved customer visits by date, territory, and party source."
        actions={
          <Link href="/visit-plans" className="btn-secondary">
            Back
          </Link>
        }
      />

      <form onSubmit={submit} className="space-y-6">
        {error && <div className="error-banner">{error}</div>}

        <section className="app-card p-6">
          <h2 className="font-bold">Plan Information</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <InputField
              label="Division"
              required
              value={form.division}
              onChange={(event) =>
                setForm({
                  ...form,
                  division: event.target.value,
                })
              }
            />

            <InputField
              label="Date From"
              type="date"
              required
              value={form.dateFrom}
              onChange={(event) =>
                setForm({
                  ...form,
                  dateFrom: event.target.value,
                })
              }
            />

            <InputField
              label="Date To"
              type="date"
              required
              value={form.dateTo}
              onChange={(event) =>
                setForm({
                  ...form,
                  dateTo: event.target.value,
                })
              }
            />

            <InputField
              label="Area"
              required
              value={form.area}
              onChange={(event) =>
                setForm({
                  ...form,
                  area: event.target.value,
                })
              }
            />

            <InputField
              label="City"
              required
              value={form.city}
              onChange={(event) =>
                setForm({
                  ...form,
                  city: event.target.value,
                })
              }
            />
          </div>
        </section>

        <section className="app-card p-6">
          <div className="flex justify-between">
            <div>
              <h2 className="font-bold">Planned Customer Visits</h2>
              <p className="mt-1 text-sm text-text-muted">
                Add one or more parties.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    partyId: "",
                    remarks: "",
                  },
                ])
              }
              className="btn-secondary"
            >
              Add Party
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface-muted/50 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="field-label">Customer</label>

                    <select
                      required
                      className="select-field"
                      value={item.partyId}
                      onChange={(event) =>
                        setItems(
                          items.map((currentItem, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentItem,
                                  partyId: event.target.value,
                                }
                              : currentItem,
                          ),
                        )
                      }
                    >
                      <option value="">Select customer</option>

                      {parties.map((party) => (
                        <option key={party._id} value={party._id}>
                          {party.companyName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <InputField
                    label="Remarks"
                    value={item.remarks}
                    onChange={(event) =>
                      setItems(
                        items.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                remarks: event.target.value,
                              }
                            : currentItem,
                        ),
                      )
                    }
                  />

                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems(
                        items.filter(
                          (_currentItem, currentIndex) =>
                            currentIndex !== index,
                        ),
                      )
                    }
                    className="btn-secondary self-end text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link href="/visit-plans" className="btn-secondary">
            Cancel
          </Link>

          <button disabled={submitting} className="btn-primary">
            {submitting ? "Creating..." : "Save Visit Plan"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

export default function NewVisitPlanPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="app-card p-6 text-sm text-muted">
            Loading visit plan form...
          </div>
        </AppShell>
      }
    >
      <NewVisitPlanPageContent />
    </Suspense>
  );
}