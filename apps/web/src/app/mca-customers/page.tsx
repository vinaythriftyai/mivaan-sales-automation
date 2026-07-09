"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { PageHeader } from "@/components/PageHeader";
import { RegisterToolbar } from "@/components/RegisterToolbar";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { exportCsv } from "@/lib/export-csv";
import type { McaCustomer } from "@/types/registers";

function includesSearch(record: McaCustomer, search: string) {
  const value = search.toLowerCase().trim();

  if (!value) return true;

  return [
    record.onboardingNumber,
    record.customerName,
    record.mobile,
    record.email,
    record.gstin,
    record.status,
    record.customerType,
    record.productCategory,
    record.erpSync?.status,
    record.erpSync?.customerCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(value);
}

export default function McaCustomersPage() {
  const [records, setRecords] = useState<McaCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [erpStatus, setErpStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get("/registers/mca-customers");

      setRecords(response.data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load MCA customers.");
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

      const currentErpStatus = record.erpSync?.status ?? record.status;

      const matchesStatus = erpStatus
        ? currentErpStatus === erpStatus
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, erpStatus]);

  function exportRecords() {
    exportCsv(
      "mca-customers.csv",
      filteredRecords.map((record) => ({
        onboardingNumber: record.onboardingNumber,
        customerName: record.customerName,
        mobile: record.mobile,
        email: record.email,
        gstin: record.gstin,
        customerType: record.customerType,
        productCategory: record.productCategory,
        qtyApproxMt: record.qtyApproxMt,
        onboardingStatus: record.status,
        erpStatus: record.erpSync?.status,
        customerCode: record.erpSync?.customerCode,
        erpAttemptCount: record.erpSync?.attemptCount,
      })),
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="MCA Customer List"
          description="Customers acquired through MCA workflow and created in BC-365."
          action={
            <button onClick={() => void loadRecords()} className="btn-secondary">
              Refresh
            </button>
          }
        />

        <RegisterToolbar
          search={search}
          onSearchChange={setSearch}
          status={erpStatus}
          onStatusChange={setErpStatus}
          statusOptions={["SUCCESS", "FAILED", "NOT_READY"]}
          searchPlaceholder="Search customer, GSTIN, onboarding number, customer code..."
          filterPlaceholder="All ERP statuses"
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
                  <th className="p-4">Onboarding No.</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">GSTIN</th>
                  <th className="p-4">Customer Code</th>
                  <th className="p-4">ERP Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="border-b border-border">
                    <td className="p-4 font-medium text-foreground">
                      {record.onboardingNumber}
                    </td>

                    <td className="p-4 text-muted">
                      {record.customerName}
                    </td>

                    <td className="p-4 text-muted">
                      {record.gstin ?? "-"}
                    </td>

                    <td className="p-4 font-semibold text-primary">
                      {record.erpSync?.customerCode ?? "-"}
                    </td>

                    <td className="p-4">
                      <StatusBadge
                        status={record.erpSync?.status ?? record.status}
                      />
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/onboarding/${record._id}`}
                        className="btn-secondary"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted">
                      No MCA customers found.
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