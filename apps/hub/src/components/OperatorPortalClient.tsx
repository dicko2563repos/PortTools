"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@porttools/ui";
import {
  accessRegisterUrl,
  pcrRecordUrl,
  pmsHomeUrl,
  pmsReportsUrl,
} from "@/lib/app-urls";

type Tab = "compliance" | "movements" | "access";

type PortSession = {
  type: "port";
  portCode: string;
  portName: string;
  movementsPortId: string;
};

type ReportsSession = {
  type: "reports";
  email: string;
};

export function OperatorPortalClient({ session }: { session: PortSession | ReportsSession }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("compliance");
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (session.type === "reports") {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Movement reports</h1>
            <p className="text-sm text-slate-600">{session.email}</p>
          </div>
          <Button type="button" variant="secondary" disabled={busy} onClick={onLogout}>
            {busy ? "Signing out…" : "Sign out"}
          </Button>
        </header>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">
            Open the cross-port movement reports view in Port Movement Summary.
          </p>
          <a
            href={pmsReportsUrl()}
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            Open reports
          </a>
        </section>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "compliance", label: "Compliance (PCR)" },
    { id: "movements", label: "Movements (PMS)" },
    { id: "access", label: "Access register" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {session.portCode} — {session.portName}
          </h1>
          <p className="text-sm text-slate-600">PortTools operator portal</p>
        </div>
        <Button type="button" variant="secondary" disabled={busy} onClick={onLogout}>
          {busy ? "Signing out…" : "Sign out"}
        </Button>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
                : "rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            }
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {tab === "compliance" && (
          <TabPanel
            title="Port Compliance Record"
            description="Yearly compliance inspections and archive."
            href={pcrRecordUrl()}
            buttonLabel="Open compliance record"
          />
        )}
        {tab === "movements" && (
          <TabPanel
            title="Port Movement Summary"
            description="Bi-weekly aircraft movement entry and period reports."
            href={pmsHomeUrl()}
            buttonLabel="Open movement summary"
          />
        )}
        {tab === "access" && (
          <TabPanel
            title="Access register"
            description="Staff ASIC and FOB tracking."
            href={accessRegisterUrl(session.movementsPortId)}
            buttonLabel="Open access register"
          />
        )}
      </section>
    </div>
  );
}

function TabPanel({
  title,
  description,
  href,
  buttonLabel,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div>
      <h2 className="font-medium text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <a
        href={href}
        className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
      >
        {buttonLabel}
      </a>
    </div>
  );
}
