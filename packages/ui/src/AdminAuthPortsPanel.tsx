"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { SecretInputRow } from "./SecretInputRow";
import {
  generateNumericPin,
  generateSecurePassword,
  readAdminApiError,
  type AdminCredentialPanelProps,
  type OneTimeSecret,
} from "./admin-credential-utils";

export type AuthPortDto = {
  id: string;
  code: string;
  name: string;
  loginEmail: string | null;
  isActive: boolean;
  hasAccessPin: boolean;
};

export type AdminAuthPortsPanelProps = AdminCredentialPanelProps;

export function AdminAuthPortsPanel({ reloadToken = 0, onSecretsRevealed }: AdminAuthPortsPanelProps) {
  const [ports, setPorts] = useState<AuthPortDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editPin, setEditPin] = useState("");

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
  }, [load, reloadToken]);

  function startEdit(port: AuthPortDto) {
    setEditingId(port.id);
    setEditPassword("");
    setEditPin("");
    setError(null);
    setMessage(null);
  }

  async function onEdit(e: React.FormEvent<HTMLFormElement>, port: AuthPortDto) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setMessage(null);
    setBusy(true);

    const password = editPassword.trim();
    const accessPin = editPin.trim();

    const res = await fetch(`/api/admin/ports/${port.id}`, {
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
      setError(await readAdminApiError(res, "Update failed"));
      return;
    }

    const secrets: OneTimeSecret[] = [];
    if (password.length > 0) {
      secrets.push({ label: `${port.code} — new shared password`, value: password });
    }
    if (accessPin.length > 0) {
      secrets.push({ label: `${port.code} — new access register PIN`, value: accessPin });
    }
    onSecretsRevealed?.(secrets);

    setMessage("Port updated");
    setEditingId(null);
    await load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Port code + shared password unlock PCR, PMS, and hub (staff login). Login email is for
        managers and reminder emails. Access PIN is for the hub Access register tab.
      </p>
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {ports.length === 0 && (
          <li className="p-3 text-sm text-slate-500">No ports yet — use Add to create one.</li>
        )}
        {ports.map((port) => (
          <li key={port.id} className="space-y-3 p-3 text-sm">
            {editingId === port.id ? (
              <form onSubmit={(e) => void onEdit(e, port)} className="space-y-3">
                <p className="font-medium">
                  {port.code}
                  {!port.isActive && (
                    <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs">Inactive</span>
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
                <SecretInputRow
                  label="New shared password (optional)"
                  minLength={8}
                  value={editPassword}
                  onChange={setEditPassword}
                  onGenerate={() => setEditPassword(generateSecurePassword())}
                  hint="Leave blank to keep the current password."
                />
                <SecretInputRow
                  label={
                    port.hasAccessPin
                      ? "New access register PIN (optional)"
                      : "Access register PIN"
                  }
                  inputMode="numeric"
                  pattern="\d{4,8}"
                  minLength={4}
                  maxLength={8}
                  value={editPin}
                  onChange={setEditPin}
                  onGenerate={() => setEditPin(generateNumericPin())}
                  hint="4–8 digits. Leave blank to keep the current PIN."
                />
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
                    onClick={() => startEdit(port)}
                  >
                    Edit
                  </Button>
                </div>
                <dl className="grid gap-1 text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Login email</dt>
                    <dd>
                      {port.loginEmail ?? (
                        <span className="text-amber-800">Not set</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      Shared password
                    </dt>
                    <dd className="text-green-800">Set (reset via Edit)</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Access PIN</dt>
                    <dd>
                      {port.hasAccessPin ? (
                        <span className="text-green-800">Configured</span>
                      ) : (
                        <span className="text-amber-800">Not set</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Unlocks</dt>
                    <dd>PCR, PMS, hub (code), Access PIN</dd>
                  </div>
                </dl>
              </>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
