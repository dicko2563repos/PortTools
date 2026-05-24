"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";

async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.length > 0 && data.error.length <= 300) {
      return data.error;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export type AuthPortDto = {
  id: string;
  code: string;
  name: string;
  loginEmail: string | null;
  remindersEnabled: boolean;
  isActive: boolean;
};

export type AdminAuthPortsPanelProps = Record<string, never>;

export function AdminAuthPortsPanel(_props: AdminAuthPortsPanelProps) {
  const [ports, setPorts] = useState<AuthPortDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/ports");
    if (!res.ok) {
      setError("Failed to load ports");
      return;
    }
    const data = (await res.json()) as { ports: AuthPortDto[] };
    setPorts(data.ports);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setMessage(null);
    setBusy(true);
    const form = new FormData(formEl);
    const res = await fetch("/api/admin/ports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        name: form.get("name"),
        loginEmail: form.get("loginEmail"),
        password: form.get("password"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Create failed"));
      return;
    }
    setMessage("Port created across PCR, PMS, and Access");
    formEl.reset();
    await load();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-medium">Ports</h2>
        <p className="mt-1 text-sm text-slate-600">
          Creates login credentials plus PCR, PMS, and Access register rows for each port.
        </p>
        <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
          {ports.length === 0 && (
            <li className="p-3 text-sm text-slate-500">No ports yet</li>
          )}
          {ports.map((port) => (
            <li key={port.id} className="p-3 text-sm">
              <div>
                <strong>{port.code}</strong> — {port.name}
                {!port.isActive && (
                  <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs">Inactive</span>
                )}
              </div>
              <p className="mt-1 text-slate-600">
                Login email: {port.loginEmail ?? (
                  <span className="text-amber-800">Not set — hub login disabled</span>
                )}
              </p>
              {port.remindersEnabled && (
                <p className="text-slate-500">Compliance email reminders enabled</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Create port</h2>
        <form
          onSubmit={onCreate}
          className="mt-2 space-y-3 rounded border border-slate-200 bg-white p-4"
        >
          <label className="block text-sm">
            Port code
            <input
              name="code"
              required
              placeholder="e.g. KGC"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 uppercase"
            />
          </label>
          <label className="block text-sm">
            Display name
            <input
              name="name"
              required
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Port login email
            <input
              name="loginEmail"
              type="email"
              required
              placeholder="ops@port.example"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <p className="text-xs text-slate-500">
            Used to sign in at porttools.com.au and for future compliance reminders.
          </p>
          <label className="block text-sm">
            Shared password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <Button type="submit" disabled={busy} className="text-sm">
            Create port
          </Button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
