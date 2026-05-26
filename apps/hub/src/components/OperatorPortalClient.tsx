"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, clearTabSession, TAB_SESSION_KEYS } from "@porttools/ui";
import {
  DEFAULT_PORTAL_TAB_ORDER,
  loadPortalTabOrder,
  PORTAL_TAB_LABELS,
  portalSessionUserKey,
  savePortalTabOrder,
  type PortalTabId,
} from "@/lib/portal-tab-order";

type Tab = PortalTabId;

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

type PortalTab = { id: Tab; label: string; href: string };

function buildPortalTabs(order: Tab[], urls: PortIframeUrls): PortalTab[] {
  return order.map((id) => ({
    id,
    label: PORTAL_TAB_LABELS[id],
    href: urls[id],
  }));
}

export function OperatorPortalClient({
  session,
  iframeUrls,
}: {
  session: PortSession | ManagerSession | ReportsSession;
  iframeUrls: PortIframeUrls | ReportsIframeUrls;
}) {
  const router = useRouter();
  const userKey = portalSessionUserKey(session);
  const [tabOrder, setTabOrder] = useState<Tab[]>(DEFAULT_PORTAL_TAB_ORDER);
  const [tab, setTab] = useState<Tab>(DEFAULT_PORTAL_TAB_ORDER[0]);
  const [customizeTabs, setCustomizeTabs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [switchingPort, setSwitchingPort] = useState(false);

  useEffect(() => {
    const order = loadPortalTabOrder(userKey);
    setTabOrder(order);
    setTab(order[0]);
  }, [userKey]);

  const applyTabOrder = useCallback(
    (nextOrder: Tab[]) => {
      const normalized = nextOrder;
      setTabOrder(normalized);
      savePortalTabOrder(userKey, normalized);
    },
    [userKey]
  );

  const moveTab = useCallback(
    (index: number, delta: -1 | 1) => {
      const target = index + delta;
      if (target < 0 || target >= tabOrder.length) return;
      const next = [...tabOrder];
      [next[index], next[target]] = [next[target], next[index]];
      applyTabOrder(next);
    },
    [applyTabOrder, tabOrder]
  );

  const resetTabOrder = useCallback(() => {
    applyTabOrder(DEFAULT_PORTAL_TAB_ORDER);
    setTab(DEFAULT_PORTAL_TAB_ORDER[0]);
  }, [applyTabOrder]);

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
    setTab(tabOrder[0]);
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
        <AppFrame title="Movement reports" src={urls.reports} visible />
      </div>
    );
  }

  const urls = iframeUrls as PortIframeUrls;
  const isManager = session.type === "manager";
  const portStackKey =
    session.type === "manager" ? session.authPortId : session.movementsPortId;

  const tabs = useMemo(() => buildPortalTabs(tabOrder, urls), [tabOrder, urls]);

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

      <div className="space-y-2 border-b border-slate-200 pb-2">
        <nav className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => setCustomizeTabs((open) => !open)}
            className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-expanded={customizeTabs}
          >
            {customizeTabs ? "Done" : "Tab order"}
          </button>
        </nav>

        {customizeTabs ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="mb-2 text-xs text-slate-600">
              Tabs open left to right. The first tab loads on sign-in; background loading
              follows this order. Saved for this login on this browser.
            </p>
            <ul className="space-y-1">
              {tabOrder.map((id, index) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-2 py-1.5 text-sm"
                >
                  <span>
                    {index + 1}. {PORTAL_TAB_LABELS[id]}
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveTab(index, -1)}
                      className="rounded px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label={`Move ${PORTAL_TAB_LABELS[id]} left`}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={index === tabOrder.length - 1}
                      onClick={() => moveTab(index, 1)}
                      className="rounded px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label={`Move ${PORTAL_TAB_LABELS[id]} right`}
                    >
                      →
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={resetTabOrder}
              className="mt-2 text-xs text-slate-500 underline hover:text-slate-700"
            >
              Reset to default order
            </button>
          </div>
        ) : null}
      </div>

      <PortalIframePanels key={portStackKey} tabs={tabs} activeTab={tab} />
    </div>
  );
}

/** Keeps visited iframes mounted so tab switches avoid SSO bridge + full reload. */
function PortalIframePanels({
  tabs,
  activeTab,
}: {
  tabs: PortalTab[];
  activeTab: Tab;
}) {
  const firstTabId = tabs[0]?.id ?? DEFAULT_PORTAL_TAB_ORDER[0];
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(() => new Set([firstTabId]));

  const mountTab = useCallback((id: Tab) => {
    setMountedTabs((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    mountTab(activeTab);
  }, [activeTab, mountTab]);

  useEffect(() => {
    mountTab(firstTabId);
  }, [firstTabId, mountTab]);

  const prefetchNext = useCallback(
    (tabId: Tab) => {
      const index = tabs.findIndex((item) => item.id === tabId);
      const next = tabs[index + 1];
      if (next) mountTab(next.id);
    },
    [mountTab, tabs]
  );

  return (
    <div className="relative min-h-0 flex-1">
      {tabs.map((item) => {
        if (!mountedTabs.has(item.id)) return null;
        const hasNext = tabs.findIndex((t) => t.id === item.id) < tabs.length - 1;
        return (
          <AppFrame
            key={item.id}
            title={item.label}
            src={item.href}
            visible={activeTab === item.id}
            onLoad={hasNext ? () => prefetchNext(item.id) : undefined}
          />
        );
      })}
    </div>
  );
}

function AppFrame({
  title,
  src,
  visible,
  onLoad,
}: {
  title: string;
  src: string;
  visible: boolean;
  onLoad?: () => void;
}) {
  return (
    <iframe
      title={title}
      src={src}
      hidden={!visible}
      aria-hidden={!visible}
      onLoad={onLoad}
      className={
        visible
          ? "absolute inset-0 h-full w-full rounded-xl border border-slate-200 bg-white"
          : "hidden"
      }
    />
  );
}
