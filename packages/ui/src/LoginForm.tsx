"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { markTabSessionActive, TAB_SESSION_KEYS } from "./tab-session";

export type LoginMode = "port" | "admin" | "reports" | "manager" | "operator" | "unified";

export type LoginEntryApp = "hub" | "pcr" | "pms" | "access";

export type LoginFormProps = {
  mode: LoginMode;
  portLoginEndpoint?: string;
  adminLoginEndpoint?: string;
  reportsLoginEndpoint?: string;
  managerLoginEndpoint?: string;
  operatorLoginEndpoint?: string;
  unifiedLoginEndpoint?: string;
  entryApp?: LoginEntryApp;
  portRedirect?: string;
  adminRedirect?: string;
  reportsRedirect?: string;
  managerRedirect?: string;
  operatorRedirect?: string;
  unifiedRedirect?: string;
};

export function LoginForm({
  mode,
  portLoginEndpoint = "/api/auth/port/login",
  adminLoginEndpoint = "/api/auth/admin/login",
  reportsLoginEndpoint = "/api/auth/reports/login",
  managerLoginEndpoint = "/api/auth/manager/login",
  operatorLoginEndpoint = "/api/auth/login",
  unifiedLoginEndpoint = "/api/auth/login",
  entryApp = "hub",
  portRedirect = "/port/record",
  adminRedirect = "/admin",
  reportsRedirect = "/reports",
  managerRedirect = "/ports",
  operatorRedirect = "/portal",
  unifiedRedirect,
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function markSessionForLoginType(type?: string, rememberWeek?: boolean) {
    if (mode === "admin") {
      markTabSessionActive(TAB_SESSION_KEYS.admin);
      return;
    }
    if (mode === "unified") {
      if (type === "reports" || entryApp === "hub") {
        markTabSessionActive(TAB_SESSION_KEYS.hub);
      }
      if (type === "manager" || entryApp === "access") {
        markTabSessionActive(TAB_SESSION_KEYS.access);
      }
      if (type === "port" && entryApp === "access") {
        markTabSessionActive(TAB_SESSION_KEYS.access);
      }
      if (type === "port" && (entryApp === "pcr" || entryApp === "pms") && !rememberWeek) {
        markTabSessionActive(
          entryApp === "pcr" ? TAB_SESSION_KEYS.pcr : TAB_SESSION_KEYS.pms
        );
      }
      return;
    }
    if (mode === "manager") {
      markTabSessionActive(TAB_SESSION_KEYS.access);
    } else if (mode === "operator") {
      markTabSessionActive(TAB_SESSION_KEYS.hub);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const endpoint =
      mode === "port"
        ? portLoginEndpoint
        : mode === "admin"
          ? adminLoginEndpoint
          : mode === "manager"
            ? managerLoginEndpoint
            : mode === "unified"
              ? unifiedLoginEndpoint
              : mode === "operator"
                ? operatorLoginEndpoint
                : reportsLoginEndpoint;

    const rememberWeek =
      mode === "unified" &&
      (entryApp === "pcr" || entryApp === "pms") &&
      form.get("rememberWeek") === "on";

    const body =
      mode === "port"
        ? { code: form.get("code"), password: form.get("password") }
        : mode === "unified"
          ? {
              identifier: form.get("identifier"),
              password: form.get("password"),
              entryApp,
              rememberWeek,
            }
          : { email: form.get("email"), password: form.get("password") };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setLoading(false);
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Login failed");
      return;
    }

    const data = (await res.json()) as {
      type?: string;
      redirect?: string;
    };

    markSessionForLoginType(data.type, rememberWeek);

    const destination =
      mode === "unified"
        ? (data.redirect ?? unifiedRedirect ?? operatorRedirect)
        : mode === "port"
          ? portRedirect
          : mode === "admin"
            ? adminRedirect
            : mode === "manager"
              ? managerRedirect
              : mode === "operator"
                ? operatorRedirect
                : reportsRedirect;

    if (destination.startsWith("http://") || destination.startsWith("https://")) {
      window.location.assign(destination);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  const identifierLabel =
    mode === "port" ? "Port code" : mode === "unified" ? "Email or port code" : "Email";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "port" ? (
        <label className="flex flex-col gap-1 text-sm">
          Port code
          <Input
            name="code"
            required
            autoComplete="username"
            placeholder="KGC"
          />
        </label>
      ) : mode === "unified" ? (
        <label className="flex flex-col gap-1 text-sm">
          {identifierLabel}
          <Input
            name="identifier"
            required
            autoComplete="username"
            placeholder="ops@port.example or KGC"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          Email
          <Input
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder={mode === "operator" ? "port@example.com" : undefined}
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Password
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {mode === "unified" && (entryApp === "pcr" || entryApp === "pms") ? (
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="rememberWeek"
            className="mt-0.5 rounded border-slate-300"
          />
          <span>Stay signed in until next Monday?</span>
        </label>
      ) : null}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="py-2">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
