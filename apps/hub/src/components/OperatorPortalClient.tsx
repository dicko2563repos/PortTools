"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, clearTabSession, TAB_SESSION_KEYS } from "@porttools/ui";
import {
  accessRegisterUrl,
  pcrRecordUrl,
  pmsMovementsUrl,
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
    clearTabSession(TAB_SESSION_KEYS.hub);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (session.type === "reports") {
    const href = pmsReportsUrl();
    return (
      <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Movement reports</h1>
            <p className="text-sm text-slate-600">{session.email}</p>
          </div>
          <Button type="button" variant="secondary" disabled={busy} onClick={onLogout}>
            {busy ? "Signing out…" : "Sign out"}
          </Button>
        </header>
        <AppFrame title="Movement reports" src={href} />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: "compliance", label: "Compliance (PCR)", href: pcrRecordUrl() },
    { id: "movements", label: "Movements (PMS)", href: pmsMovementsUrl() },
    {
      id: "access",
      label: "Access register",
      href: accessRegisterUrl(session.movementsPortId),
    },
  ];

  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0]!;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-4">
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

      <AppFrame key={activeTab.href} title={activeTab.label} src={activeTab.href} />
    </div>
  );
}

function AppFrame({ title, src }: { title: string; src: string }) {
  return (
    <iframe
      title={title}
      src={src}
      className="min-h-0 w-full flex-1 rounded-xl border border-slate-200 bg-white"
    />
  );
}
