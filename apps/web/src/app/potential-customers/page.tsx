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
import type { RegisterParty } from "@/types/registers";

function includesSearch(record: RegisterParty, search: string) {
  const value = search.toLowerCase().trim();

  if (!value) return true;

  return [
    record.companyName,
    record.mobile,
    record.email,
    record.gstin,
    record.status,
    record.customerType,
    record.productCategory,
    record.city,
    record.area,
    record.products?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(value);
}

export default function PotentialCustomersPage() {
  const [records, setRecords] = useState<RegisterParty[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get(
        "/registers/potential-customers",
      );

      setRecords(response.data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Could not load potential customers.");
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
      const matchesStatus = status
        ? record.status === status
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, status]);

  function exportRecords() {
    exportCsv(
      "potential-customers.csv",
      filteredRecords.map((record) => ({
        customerName: record.companyName,
        mobile: record.mobile,
        email: record.email,
        gstin: record.gstin,
        status: record.status,
        customerType: record.customerType,
        productCategory: record.productCategory,
        products: record.products?.join(" | "),
        qtyApproxMt: record.qtyApproxMt,
        city: record.city,
        area: record.area,
      })),
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <PageHeader
          title="Potential Customer List"
          description="Customers qualified as potential or high-potential after visit."
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
          status={status}
          onStatusChange={setStatus}
          statusOptions={["POTENTIAL", "HIGH_POTENTIAL"]}
          onExport={exportRecords}
        />

        {isLoading && (
          <div className="app-card p-6 text-sm text-muted">
            Loading...
          </div>
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
                  <th className="p-4">Customer</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-border"
                  >
                    <td className="p-4 font-semibold text-foreground">
                      {record.companyName}
                    </td>
                    <td className="p-4 text-muted">
                      {record.mobile ?? "-"}
                    </td>
                    <td className="p-4 text-muted">
                      {record.productCategory ?? "-"}
                    </td>
                    <td className="p-4 text-muted">
                      {record.qtyApproxMt ?? 0} MT
                    </td>
                    <td className="p-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/leads/${record._id}`}
                        className="btn-secondary"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center text-muted"
                    >
                      No potential customers found.
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