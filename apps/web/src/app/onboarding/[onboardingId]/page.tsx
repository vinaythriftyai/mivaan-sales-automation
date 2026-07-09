"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { labelFromEnum } from "@/lib/status-colors";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, OnboardingRequest } from "@/types";
import { AuditTimeline } from "@/components/AuditTimeline";
import {
  ArrowLeft,
  Check,
  DatabaseZap,
  FileSearch,
  RefreshCcw,
  Send,
  Upload,
  X,
} from "lucide-react";
export default function OnboardingDetailPage() {
  const { onboardingId } = useParams<{ onboardingId: string }>();
  const user = getStoredUser();
  const [record, setRecord] = useState<OnboardingRequest | null>(null);
  const [documentType, setDocumentType] = useState("GST_CERTIFICATE");
  const [file, setFile] = useState<File | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function load() {
    setLoading(true);
    try {
      const r = await api.get<ApiResponse<OnboardingRequest>>(
        `/onboarding/${onboardingId}`,
      );
      setRecord(r.data.data);
      setSelectedAddressId(r.data.data.selectedAddressId ?? "");
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to load onboarding request"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [onboardingId]);

  async function run(action: () => Promise<unknown>, message: string) {
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to complete action"));
    }
  }

  async function upload() {
    if (!file) {
      setError("Select a document first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", documentType);
    await run(
      () =>
        api.post(`/onboarding/${onboardingId}/documents`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      "Document uploaded.",
    );
  }
  async function createCustomerInBc365(): Promise<void> {
    setActionLoading("erp");
    setError("");
    setSuccess("");

    try {
      const response = await api.post<ApiResponse<OnboardingRequest>>(
        `/onboarding/${onboardingId}/sync-erp`,
        {},
      );

      setRecord(response.data.data);

      const customerCode = response.data.data.erpSync?.customerCode;

      setSuccess(
        customerCode
          ? `Customer created successfully in BC-365. Customer code: ${customerCode}`
          : "Customer created successfully in BC-365.",
      );

      await load();
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to create customer in BC-365"),
      );
    } finally {
      setActionLoading("");
    }
  }
  if (loading)
    return (
      <AppShell>
        <div className="app-card p-10 text-center text-text-muted">
          Loading onboarding request...
        </div>
      </AppShell>
    );
  if (!record)
    return (
      <AppShell>
        <div className="error-banner">
          {error || "Onboarding request not found"}
        </div>
      </AppShell>
    );

  const canApprove = user?.role === "HOD" || user?.role === "SYSTEM_ADMIN";

  return (
    <AppShell>
      <PageHeader
        title={record.onboardingNumber}
        description="Customer verification, document capture, HOD approval, and BC-365 creation."
        actions={
          <Link href="/onboarding" className="btn-secondary">
            Back
          </Link>
        }
      />
      {error && <div className="error-banner mb-5">{error}</div>}
      {success && <div className="success-banner mb-5">{success}</div>}
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <section className="app-card p-6">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm text-text-muted">Customer</p>
                <p className="mt-1 text-xl font-bold">{record.customerName}</p>
              </div>
              <StatusBadge status={record.status} />
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Mobile", record.mobile],
                ["Email", record.email ?? "—"],
                ["GSTIN", record.gstin ?? "—"],
                ["Source", labelFromEnum(record.source)],
                ["Customer Type", record.customerType],
                ["Product Category", record.productCategory],
                ["Quantity", `${record.qtyApproxMt} MT`],
                ["GST Status", record.gstVerification?.status ?? "NOT_STARTED"],
                ["ERP Sync", record.erpSync?.status ?? "NOT_READY"],
              ].map(([l, v]) => (
                <Info key={l} label={l} value={v} />
              ))}
            </div>
          </section>

          <section className="app-card p-6">
            <h2 className="font-bold">Uploaded Documents</h2>
            <div className="mt-4 grid gap-3">
              {record.documents.length ? (
                record.documents.map((d, i) => (
                  <div
                    key={d._id ?? i}
                    className="flex justify-between rounded-xl border border-border p-4"
                  >
                    <div>
                      <p className="font-semibold">{labelFromEnum(d.type)}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {d.originalName ?? "Uploaded document"}
                      </p>
                    </div>
                    <StatusBadge status="COMPLETED" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted">
                  No documents uploaded.
                </p>
              )}
            </div>
          </section>

          <section className="app-card p-6">
            <h2 className="font-bold">Extracted GST Data</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                ["Legal Name", record.extractedData?.legalName ?? "—"],
                ["Trade Name", record.extractedData?.tradeName ?? "—"],
                ["Extracted GSTIN", record.extractedData?.gstin ?? "—"],
                ["PAN", record.extractedData?.pan ?? "—"],
                [
                  "Registration Status",
                  record.extractedData?.registrationStatus ?? "—",
                ],
                [
                  "OCR Confidence",
                  record.extractedData?.confidence !== undefined
                    ? `${Math.round(record.extractedData.confidence * 100)}%`
                    : "—",
                ],
              ].map(([l, v]) => (
                <Info key={l} label={l} value={v} />
              ))}
            </div>
          </section>

          <section className="app-card p-6">
            <h2 className="font-bold">Customer Master Address</h2>
            <p className="mt-1 text-sm text-text-muted">
              Select one address before submission.
            </p>
            <div className="mt-5 space-y-3">
              {record.addresses.map((a, i) => {
                const id = a._id ?? String(i);
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${selectedAddressId === id ? "border-primary bg-blue-50" : "border-border"}`}
                  >
                    <input
                      type="radio"
                      checked={selectedAddressId === id}
                      onChange={() => setSelectedAddressId(id)}
                    />
                    <div>
                      <p className="font-semibold">
                        {a.label ?? `Address ${i + 1}`}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">
                        {[a.line1, a.line2, a.city, a.state, a.pinCode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </label>
                );
              })}
              {record.addresses.length === 0 && (
                <p className="text-sm text-text-muted">
                  Run OCR and GST verification to retrieve addresses.
                </p>
              )}
            </div>
            <button
              disabled={!selectedAddressId}
              onClick={() =>
                void run(
                  () =>
                    api.post(`/onboarding/${onboardingId}/select-address`, {
                      addressId: selectedAddressId,
                    }),
                  "Address selected.",
                )
              }
              className="btn-secondary mt-4"
            >
              Save Address Selection
            </button>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="app-card p-6">
            <h2 className="font-bold">Document Upload</h2>
            <select
              className="select-field mt-4"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="GST_CERTIFICATE">GST Certificate</option>
              <option value="TRADE_DECLARATION">Trade Declaration</option>
            </select>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="input-field mt-3"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFile(e.target.files?.[0] ?? null)
              }
            />
            <button
              onClick={() => void upload()}
              className="btn-primary mt-3 w-full"
            >
              Upload Document
            </button>
          </section>
          <section className="app-card p-6">
            <h2 className="font-bold">Verification</h2>

            <button
              onClick={() =>
                void run(
                  () => api.post(`/onboarding/${onboardingId}/run-ocr`, {}),
                  "OCR completed.",
                )
              }
              className="btn-secondary mt-4 w-full"
            >
              Run OCR
            </button>

            <button
              onClick={() =>
                void run(
                  () => api.post(`/onboarding/${onboardingId}/verify-gst`, {}),
                  "GST verified.",
                )
              }
              className="btn-secondary mt-3 w-full"
            >
              Verify GST
            </button>
          </section>

          <section className="app-card p-6">
            <h2 className="font-bold">Workflow Actions</h2>

            {["DRAFT", "READY_FOR_REVIEW"].includes(record.status) && (
              <button
                onClick={() =>
                  void run(
                    () => api.post(`/onboarding/${onboardingId}/submit`, {}),
                    "Submitted for approval.",
                  )
                }
                className="btn-primary mt-4 w-full"
              >
                Submit for Approval
              </button>
            )}

            {record.status === "PENDING_APPROVAL" && canApprove && (
              <>
                <button
                  onClick={() =>
                    void run(
                      () => api.post(`/onboarding/${onboardingId}/approve`, {}),
                      "Onboarding approved.",
                    )
                  }
                  className="btn-primary mt-4 w-full bg-success"
                >
                  Approve Onboarding
                </button>

                <textarea
                  rows={3}
                  className="textarea-field mt-3"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Rejection reason"
                />

                <button
                  onClick={() =>
                    reason.trim()
                      ? void run(
                          () =>
                            api.post(`/onboarding/${onboardingId}/reject`, {
                              reason: reason.trim(),
                            }),
                          "Onboarding rejected.",
                        )
                      : setError("Enter rejection reason")
                  }
                  className="btn-danger mt-3 w-full"
                >
                  Reject Onboarding
                </button>
              </>
            )}

            {["APPROVED", "SYNC_FAILED"].includes(record.status) &&
              canApprove && (
                <button
                  onClick={() =>
                    void run(
                      () =>
                        api.post(`/onboarding/${onboardingId}/sync-erp`, {}),
                      "Customer created in BC-365.",
                    )
                  }
                  className="btn-primary mt-4 w-full bg-success"
                >
                  Sync ERP / Create Customer in BC-365
                </button>
              )}

            {record.status === "CUSTOMER_CREATED" && (
              <div className="success-banner mt-4">
                Customer has already been created in BC-365.
              </div>
            )}

            {!canApprove &&
              ["APPROVED", "SYNC_FAILED"].includes(record.status) && (
                <div className="mt-4 rounded-xl border border-warning bg-orange-50 p-4 text-sm text-warning">
                  Only HOD or System Admin can sync this onboarding to ERP.
                </div>
              )}
          </section>
          <section className="app-card p-6">
            <h2 className="font-bold">ERP Result</h2>
            <div className="mt-4 space-y-3">
              <Info
                label="Status"
                value={record.erpSync?.status ?? "NOT_READY"}
              />
              <Info
                label="Customer Code"
                value={record.erpSync?.customerCode ?? "—"}
              />
              <Info
                label="Last Error"
                value={record.erpSync?.lastError ?? "—"}
              />
            </div>
          </section>
        </aside>
        <AuditTimeline
          entityType="ONBOARDING"
          entityId={onboardingId}
          title="Onboarding Audit Timeline"
        />
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  );
}
