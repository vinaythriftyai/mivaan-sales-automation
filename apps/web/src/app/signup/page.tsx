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

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", territory: "", division: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (field: keyof typeof form, value: string) => setForm((x) => ({ ...x, [field]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setSubmitting(true);
    try {
      const response = await api.post<LoginResponse>("/auth/signup", form);
      saveAuth(response.data.data.accessToken, response.data.data.user);
      router.push("/dashboard");
    } catch (e) { setError(getApiErrorMessage(e, "Unable to create account")); }
    finally { setSubmitting(false); }
  }

  return <AuthShell title="Create development account" subtitle="This local signup flow creates a CAM user for testing.">
    <form onSubmit={submit} className="space-y-5">
      {error && <div className="error-banner">{error}</div>}
      <InputField label="Full Name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
      <InputField label="Email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2"><InputField label="Territory" value={form.territory} onChange={(e) => update("territory", e.target.value)} /><InputField label="Division" value={form.division} onChange={(e) => update("division", e.target.value)} /></div>
      <InputField label="Password" type="password" required value={form.password} onChange={(e) => update("password", e.target.value)} help="At least 8 characters with uppercase, lowercase, and a number." />
      <InputField label="Confirm Password" type="password" required value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
      <button disabled={submitting} className="btn-primary w-full">{submitting ? "Creating..." : "Create account"}</button>
      <p className="text-center text-sm text-text-muted">Already registered? <Link href="/login" className="font-semibold text-primary">Sign in</Link></p>
    </form>
  </AuthShell>;
}
