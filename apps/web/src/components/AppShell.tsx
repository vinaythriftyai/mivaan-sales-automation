"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearAuth, getStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/types";

const nav = [
  ["Dashboard", "/dashboard"],
  ["Lead Register", "/leads"],

  ["Potential Customers", "/potential-customers"],
  ["Existing Customers", "/existing-customers"],
  ["MCA Customers", "/mca-customers"],
  ["Activity Register", "/activities"],
  ["Follow-ups", "/follow-ups"],

  ["Visit Plans", "/visit-plans"],
  ["Approvals", "/approvals"],
  ["Customer Onboarding", "/onboarding"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <div className="rounded-xl bg-primary px-3 py-2 text-lg font-black">
              MS
            </div>

            <div>
              <p className="font-bold">Mivaan</p>
              <p className="text-xs text-slate-400">Sales Automation</p>
            </div>
          </Link>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-400 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {nav.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            if (
              label === "Approvals" &&
              user &&
              !["HOD", "SYSTEM_ADMIN"].includes(user.role)
            ) {
              return null;
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:bg-sidebar-secondary hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="truncate text-sm font-semibold">
              {user?.name ?? "Mivaan User"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {user?.role ?? "User"}
            </p>

            <button
              onClick={logout}
              className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-surface/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-4">
            <button
              className="rounded-lg border border-border px-3 py-2 lg:hidden"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>

            <div>
              <p className="text-sm font-semibold">
                Sales & Marketing Operations
              </p>
              <p className="text-xs text-text-muted">
                Customer acquisition and onboarding
              </p>
            </div>
          </div>

          <span className="hidden text-xs font-medium text-success sm:block">
            ● Human approvals enabled
          </span>
        </header>

        <main className="px-5 py-7 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
