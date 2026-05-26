"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { SecretInputRow } from "./SecretInputRow";
import {
  generateSecurePassword,
  readAdminApiError,
  type AdminCredentialPanelProps,
  type OneTimeSecret,
} from "./admin-credential-utils";

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

export type AdminManagersPanelProps = AdminCredentialPanelProps;

export function AdminManagersPanel({ reloadToken = 0, onSecretsRevealed }: AdminManagersPanelProps) {
  const [managers, setManagers] = useState<ManagerDto[]>([]);
  const [ports, setPorts] = useState<AuthPortOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editPassword, setEditPassword] = useState("");

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
  }, [load, reloadToken]);

  async function onEdit(e: React.FormEvent<HTMLFormElement>, manager: ManagerDto) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setMessage(null);
    const password = editPassword.trim();
    const authPortIds = form.getAll("authPortIds").map(String);
    const res = await fetch(`/api/admin/managers/${manager.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(password.length > 0 ? { password } : {}),
        authPortIds,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readAdminApiError(res, "Update failed"));
      return;
    }
    if (password.length > 0) {
      onSecretsRevealed?.([
        { label: `${manager.email} — new password`, value: password },
      ]);
    }
    setMessage("Manager updated");
    setEditingId(null);
    setEditPassword("");
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
      setError(await readAdminApiError(res, "Update failed"));
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
      setError(await readAdminApiError(res, "Delete failed"));
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
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Managers sign in with port login email + password at the hub and manager portal. Assign
        which ports each manager can access.
      </p>
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {managers.length === 0 && (
          <li className="p-3 text-sm text-slate-500">No managers yet — use Add to create one.</li>
        )}
        {managers.map((manager) => (
          <li key={manager.id} className="p-3">
            {editingId === manager.id ? (
              <form onSubmit={(e) => void onEdit(e, manager)} className="space-y-3">
                <p className="text-sm font-medium">{manager.email}</p>
                <SecretInputRow
                  label="New password (optional)"
                  minLength={8}
                  value={editPassword}
                  onChange={setEditPassword}
                  onGenerate={() => setEditPassword(generateSecurePassword())}
                  hint="Leave blank to keep the current password."
                />
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
                    onClick={() => {
                      setEditingId(null);
                      setEditPassword("");
                    }}
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
                  <p className="text-xs text-slate-500">Unlocks: Hub, manager portal, assigned ports</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    className="text-slate-600 underline hover:no-underline"
                    onClick={() => {
                      setEditingId(manager.id);
                      setEditPassword("");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-slate-600 underline hover:no-underline"
                    onClick={() => void toggleActive(manager)}
                  >
                    {manager.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="text-red-700 underline hover:no-underline"
                    onClick={() => void deleteManager(manager.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
