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
  isActive: boolean;
  hasAccessPin: boolean;
};

export type AdminAuthPortsPanelProps = Record<string, never>;

export function AdminAuthPortsPanel(_props: AdminAuthPortsPanelProps) {
  const [ports, setPorts] = useState<AuthPortDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
        accessPin: form.get("accessPin"),
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

  async function onEdit(e: React.FormEvent<HTMLFormElement>, portId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setMessage(null);
    setBusy(true);

    const password = String(form.get("password") ?? "").trim();
    const accessPin = String(form.get("accessPin") ?? "").trim();

    const res = await fetch(`/api/admin/ports/${portId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        loginEmail: form.get("loginEmail"),
        isActive: form.get("isActive") === "on",
        ...(password.length > 0 ? { password } : {}),
        ...(accessPin.length > 0 ? { accessPin } : {}),
      }),
    });
    setBusy(false);

    if (!res.ok) {
      setError(await readApiError(res, "Update failed"));
      return;
    }

    setMessage("Port updated");
    setEditingId(null);
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
            <li key={port.id} className="space-y-3 p-3 text-sm">
              {editingId === port.id ? (
                <form onSubmit={(e) => void onEdit(e, port.id)} className="space-y-3">
                  <p className="font-medium">
                    {port.code}
                    {!port.isActive && (
                      <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs">
                        Inactive
                      </span>
                    )}
                  </p>
                  <label className="block text-sm">
                    Display name
                    <input
                      name="name"
                      required
                      defaultValue={port.name}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </label>
                  <label className="block text-sm">
                    Port login email
                    <input
                      name="loginEmail"
                      type="email"
                      required
                      defaultValue={port.loginEmail ?? ""}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="isActive" type="checkbox" defaultChecked={port.isActive} />
                    Port active
                  </label>
                  <label className="block text-sm">
                    New shared password (optional)
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </label>
                  <label className="block text-sm">
                    {port.hasAccessPin ? "New access register PIN (optional)" : "Access register PIN"}
                    <input
                      name="accessPin"
                      type="password"
                      inputMode="numeric"
                      pattern="\d{4,8}"
                      minLength={4}
                      maxLength={8}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1 tracking-widest"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    PIN is 4–8 digits. Leave blank to keep the current PIN.
                  </p>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy} className="px-3 py-1 text-sm">
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <strong>{port.code}</strong> — {port.name}
                      {!port.isActive && (
                        <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                      onClick={() => setEditingId(port.id)}
                    >
                      Edit
                    </Button>
                  </div>
                  <p className="text-slate-600">
                    Login email:{" "}
                    {port.loginEmail ?? (
                      <span className="text-amber-800">Not set — hub login disabled</span>
                    )}
                  </p>
                  <p className="text-slate-600">
                    Access register PIN:{" "}
                    {port.hasAccessPin ? (
                      <span className="text-green-800">Configured</span>
                    ) : (
                      <span className="text-amber-800">
                        Not set — hub operators cannot open register
                      </span>
                    )}
                  </p>
                </>
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
            Access register PIN
            <input
              name="accessPin"
              type="password"
              inputMode="numeric"
              required
              minLength={4}
              maxLength={8}
              pattern="\d{4,8}"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 tracking-widest"
            />
          </label>
          <p className="text-xs text-slate-500">
            Numeric PIN (4–8 digits) for port operators opening the access register from the hub.
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
