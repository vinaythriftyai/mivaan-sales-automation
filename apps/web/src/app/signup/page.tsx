"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/AuthShell";
import { InputField } from "@/components/FormControls";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { LoginResponse } from "@/types";

type SignupRole = "CAM" | "HOD" | "SALES" | "ACCOUNTS" | "SYSTEM_ADMIN";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CAM" as SignupRole,
    territory: "",
    division: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post<LoginResponse>("/auth/signup", {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        territory: form.territory || undefined,
        division: form.division || undefined,
      });

      saveAuth(response.data.data.accessToken, response.data.data.user);
      router.push("/dashboard");
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to create account"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create development account"
      subtitle="Create a demo user and choose the required role for testing."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <div className="error-banner">{error}</div>}

        <InputField
          label="Full Name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />

        <InputField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-text">Role</span>
          <select
            required
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="CAM">CAM</option>
            <option value="HOD">HOD</option>
            <option value="SALES">Sales</option>
            <option value="ACCOUNTS">Accounts</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Territory"
            value={form.territory}
            onChange={(e) => update("territory", e.target.value)}
          />

          <InputField
            label="Division"
            value={form.division}
            onChange={(e) => update("division", e.target.value)}
          />
        </div>

        <InputField
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          help="At least 8 characters with uppercase, lowercase, and a number."
        />

        <InputField
          label="Confirm Password"
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
        />

        <button disabled={submitting} className="btn-primary w-full">
          {submitting ? "Creating..." : "Create account"}
        </button>

        <p className="text-center text-sm text-text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}