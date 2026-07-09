"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { getAccessToken, saveAuth } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/get-api-error";
import type { LoginResponse } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (getAccessToken()) router.replace("/dashboard"); }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const response = await api.post<LoginResponse>("/auth/login", { email, password });
      saveAuth(response.data.data.accessToken, response.data.data.user);
      router.push("/dashboard");
    } catch (e) { setError(getApiErrorMessage(e, "Unable to log in")); }
    finally { setSubmitting(false); }
  }

  return <AuthShell title="Welcome back" subtitle="Sign in to manage leads, visits, approvals, and customer onboarding.">
    <form onSubmit={submit} className="space-y-5">
      {error && <div className="error-banner">{error}</div>}
      <div><label className="field-label">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="name@mivaan.local" /></div>
      <div><label className="field-label">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter password" /></div>
      <button disabled={submitting} className="btn-primary w-full">{submitting ? "Signing in..." : "Sign in"}</button>
      <p className="text-center text-sm text-text-muted">Development user? <Link href="/signup" className="font-semibold text-primary">Create account</Link></p>
    </form>
  </AuthShell>;
}
