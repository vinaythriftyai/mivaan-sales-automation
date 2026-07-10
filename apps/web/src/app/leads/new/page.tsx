"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AppShell } from "@/components/AppShell";
import {
  InputField,
  SelectField,
  TextAreaField,
} from "@/components/FormControls";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { ApiResponse, Party } from "@/types";

const initial = {
  companyName: "",
  mobile: "",
  email: "",
  source: "NEW_PROSPECT",
  customerType: "DEALER",
  productCategory: "STRUCTURAL_STEEL",
  products: "",
  qtyApproxMt: "",
  area: "",
  city: "",
  address: "",
  gstin: "",
  remarks: "",
};

const sourceOptions = [
  { value: "NEW_PROSPECT", label: "New Prospect" },
  { value: "MARKET_VISIT", label: "Market Visit" },
  { value: "REFERENCE", label: "Reference" },
  { value: "INBOUND", label: "Inbound" },
  { value: "INTERNET_SEARCH", label: "Internet Search" },
  { value: "MCA_PORTAL", label: "MCA Portal" },
];

const customerTypeOptions = [
  { value: "DEALER", label: "Dealer" },
  { value: "TRADER", label: "Trader" },
  { value: "FABRICATOR", label: "Fabricator" },
  { value: "OEM", label: "OEM" },
  { value: "STOCKIST", label: "Stockist" },
];

const productCategoryOptions = [
  { value: "STRUCTURAL_STEEL", label: "Structural Steel" },
];

export default function NewLeadPage() {
  const router = useRouter();

  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const user = getStoredUser();

      if (!user) {
        throw new Error("Current user is unavailable");
      }

      const response = await api.post<ApiResponse<{ party: Party }>>(
        "/parties",
        {
          companyName: form.companyName,
          mobile: form.mobile,
          email: form.email || undefined,
          source: form.source,
          customerType: form.customerType,
          productCategory: form.productCategory,
          products: form.products
            .split(",")
            .map((product) => product.trim())
            .filter(Boolean),
          qtyApproxMt: form.qtyApproxMt
            ? Number(form.qtyApproxMt)
            : undefined,
          area: form.area || undefined,
          city: form.city || undefined,
          address: form.address || undefined,
          gstin: form.gstin ? form.gstin.toUpperCase() : undefined,
          assignedCamId: user.id,
          remarks: form.remarks || undefined,
        },
      );

      router.push(`/leads/${response.data.data.party._id}`);
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to create prospect"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Add New Prospect"
        description="Capture party contact details, business profile, steel requirement, source, and remarks."
        actions={
          <Link href="/leads" className="btn-secondary">
            Back to Register
          </Link>
        }
      />

      <form onSubmit={submit} className="app-card space-y-7 p-6">
        {error && <div className="error-banner">{error}</div>}

        <section>
          <h2 className="font-bold">Party Information</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InputField
              label="Company Name"
              required
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
            />

            <SelectField
              label="Lead Source"
              required
              options={sourceOptions}
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
            />

            <InputField
              label="Mobile"
              required
              value={form.mobile}
              onChange={(e) => update("mobile", e.target.value)}
            />

            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
        </section>

        <section className="border-t border-border pt-7">
          <h2 className="font-bold">Business Requirement</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <SelectField
              label="Customer Type"
              required
              options={customerTypeOptions}
              value={form.customerType}
              onChange={(e) => update("customerType", e.target.value)}
            />

            <SelectField
              label="Product Category"
              required
              options={productCategoryOptions}
              value={form.productCategory}
              onChange={(e) => update("productCategory", e.target.value)}
            />

            <InputField
              label="Products"
              placeholder="Beam, Channel, Angle"
              value={form.products}
              onChange={(e) => update("products", e.target.value)}
              help="Separate multiple products with commas."
            />

            <InputField
              label="Approximate Quantity (MT)"
              type="number"
              min="0"
              value={form.qtyApproxMt}
              onChange={(e) => update("qtyApproxMt", e.target.value)}
            />
          </div>
        </section>

        <section className="border-t border-border pt-7">
          <h2 className="font-bold">Location and GST</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InputField
              label="Area"
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
            />

            <InputField
              label="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />

            <InputField
              label="GSTIN"
              value={form.gstin}
              onChange={(e) => update("gstin", e.target.value.toUpperCase())}
            />
          </div>

          <div className="mt-5">
            <TextAreaField
              label="Address"
              rows={3}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
        </section>

        <section className="border-t border-border pt-7">
          <TextAreaField
            label="Remarks"
            rows={4}
            value={form.remarks}
            onChange={(e) => update("remarks", e.target.value)}
          />
        </section>

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Link href="/leads" className="btn-secondary">
            Cancel
          </Link>

          <button disabled={submitting} className="btn-primary">
            {submitting ? "Creating..." : "Create Prospect"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}