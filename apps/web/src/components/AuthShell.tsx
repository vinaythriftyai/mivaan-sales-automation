export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="hidden bg-sidebar px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-3">
            <div className="rounded-xl bg-primary px-3 py-2 text-lg font-black">
              MS
            </div>
            <div>
              <p className="font-bold">Mivaan</p>
              <p className="text-xs text-slate-400">Sales Automation</p>
            </div>
          </div>
          <h2 className="mt-16 max-w-xl text-4xl font-bold leading-tight">
            Intelligent workflows for modern steel operations.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Manage leads, field visits, approvals, customer onboarding, and ERP
            readiness through one controlled workspace.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
          Structured execution · Human approval controls · Full auditability
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md app-card p-7 sm:p-9">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </main>
  );
}
