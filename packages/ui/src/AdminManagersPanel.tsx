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

export type AuthPortOption = {
  id: string;
  code: string;
  name: string;
};

export type ManagerDto = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  authPortIds: string[];
};

export type AdminManagersPanelProps = Record<string, never>;

export function AdminManagersPanel(_props: AdminManagersPanelProps) {
  const [managers, setManagers] = useState<ManagerDto[]>([]);
  const [ports, setPorts] = useState<AuthPortOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [managersRes, portsRes] = await Promise.all([
      fetch("/api/admin/managers"),
      fetch("/api/admin/auth-ports"),
    ]);
    if (!managersRes.ok || !portsRes.ok) {
      setError("Failed to load managers");
      return;
    }
    const managersData = (await managersRes.json()) as { managers: ManagerDto[] };
    const portsData = (await portsRes.json()) as { ports: AuthPortOption[] };
    setManagers(managersData.managers);
    setPorts(portsData.ports);
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
    const authPortIds = form.getAll("authPortIds").map(String);
    const res = await fetch("/api/admin/managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        authPortIds,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Create failed"));
      return;
    }
    setMessage("Manager created");
    formEl.reset();
    await load();
  }

  async function onEdit(e: React.FormEvent<HTMLFormElement>, managerId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setMessage(null);
    const password = String(form.get("password") ?? "").trim();
    const authPortIds = form.getAll("authPortIds").map(String);
    const res = await fetch(`/api/admin/managers/${managerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(password.length > 0 ? { password } : {}),
        authPortIds,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Update failed"));
      return;
    }
    setMessage("Manager updated");
    setEditingId(null);
    await load();
  }

  async function toggleActive(manager: ManagerDto) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/managers/${manager.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !manager.isActive }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Update failed"));
      return;
    }
    setMessage(manager.isActive ? "Manager disabled" : "Manager enabled");
    await load();
  }

  async function deleteManager(managerId: string) {
    if (!window.confirm("Delete this manager account?")) return;
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/managers/${managerId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await readApiError(res, "Delete failed"));
      return;
    }
    setMessage("Manager deleted");
    await load();
  }

  function portLabels(authPortIds: string[]) {
    return authPortIds
      .map((id) => ports.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => p!.code)
      .join(", ");
  }

  function PortCheckboxes({
    name,
    defaultSelected,
  }: {
    name: string;
    defaultSelected?: string[];
  }) {
    if (ports.length === 0) {
      return <p className="text-sm text-slate-500">No ports in auth registry yet.</p>;
    }
    return (
      <div className="flex flex-wrap gap-3">
        {ports.map((port) => (
          <label key={port.id} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              name={name}
              value={port.id}
              defaultChecked={defaultSelected?.includes(port.id)}
            />
            {port.code}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-medium">Access managers</h2>
        <p className="mt-1 text-sm text-slate-600">
          Managers sign in to the Access register console for assigned ports only.
        </p>
        <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
          {managers.length === 0 && (
            <li className="p-3 text-sm text-slate-500">No managers yet</li>
          )}
          {managers.map((manager) => (
            <li key={manager.id} className="p-3">
              {editingId === manager.id ? (
                <form onSubmit={(e) => onEdit(e, manager.id)} className="space-y-3">
                  <p className="text-sm font-medium">{manager.email}</p>
                  <label className="block text-sm">
                    New password (optional)
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                    />
                  </label>
                  <fieldset>
                    <legend className="text-sm font-medium">Ports</legend>
                    <PortCheckboxes name="authPortIds" defaultSelected={manager.authPortIds} />
                  </fieldset>
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{manager.email}</span>
                      {!manager.isActive && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">Disabled</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      Ports: {portLabels(manager.authPortIds) || "None"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      className="text-slate-600 underline hover:no-underline"
                      onClick={() => setEditingId(manager.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-slate-600 underline hover:no-underline"
                      onClick={() => toggleActive(manager)}
                    >
                      {manager.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      className="text-red-700 underline hover:no-underline"
                      onClick={() => deleteManager(manager.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Add manager</h2>
        <form
          onSubmit={onCreate}
          className="mt-2 space-y-3 rounded border border-slate-200 bg-white p-4"
        >
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Ports</legend>
            <PortCheckboxes name="authPortIds" />
          </fieldset>
          <Button type="submit" disabled={busy} className="text-sm">
            Create manager
          </Button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
