"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, clearTabSession, TAB_SESSION_KEYS } from "@porttools/ui";

type Tab = "compliance" | "movements" | "access";

type PortOption = {
  authPortId: string;
  movementsPortId: string;
  code: string;
  name: string;
};

type PortSession = {
  type: "port";
  portCode: string;
  portName: string;
  movementsPortId: string;
};

type ManagerSession = {
  type: "manager";
  email: string;
  authPortId: string;
  portCode: string;
  portName: string;
  movementsPortId: string;
  ports: PortOption[];
};

type ReportsSession = {
  type: "reports";
  email: string;
};

type PortIframeUrls = {
  compliance: string;
  movements: string;
  access: string;
};

type ReportsIframeUrls = {
  reports: string;
};

export function OperatorPortalClient({
  session,
  iframeUrls,
}: {
  session: PortSession | ManagerSession | ReportsSession;
  iframeUrls: PortIframeUrls | ReportsIframeUrls;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("compliance");
  const [busy, setBusy] = useState(false);
  const [switchingPort, setSwitchingPort] = useState(false);

  async function onLogout() {
    setBusy(true);
    clearTabSession(TAB_SESSION_KEYS.hub);
    clearTabSession(TAB_SESSION_KEYS.access);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function onPortChange(authPortId: string) {
    if (session.type !== "manager" || authPortId === session.authPortId) return;
    setSwitchingPort(true);
    const res = await fetch("/api/session/port", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authPortId }),
    });
    setSwitchingPort(false);
    if (!res.ok) return;
    router.refresh();
  }

  if (session.type === "reports") {
    const urls = iframeUrls as ReportsIframeUrls;
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
        <AppFrame title="Movement reports" src={urls.reports} />
      </div>
    );
  }

  const urls = iframeUrls as PortIframeUrls;
  const isManager = session.type === "manager";

  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: "compliance", label: "Compliance (PCR)", href: urls.compliance },
    { id: "movements", label: "Movements (PMS)", href: urls.movements },
    { id: "access", label: "Access register", href: urls.access },
  ];

  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0]!;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">
            {session.portCode} — {session.portName}
          </h1>
          <p className="text-sm text-slate-600">
            {isManager ? "PortTools manager portal" : "PortTools operator portal"}
          </p>
          {isManager && session.ports.length > 1 ? (
            <label className="mt-2 block max-w-xs text-sm text-slate-600">
              Port
              <select
                value={session.authPortId}
                disabled={switchingPort}
                onChange={(e) => void onPortChange(e.target.value)}
                className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-900"
              >
                {session.ports.map((port) => (
                  <option key={port.authPortId} value={port.authPortId}>
                    {port.code} — {port.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
