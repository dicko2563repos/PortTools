"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { SecretInputRow } from "./SecretInputRow";
import {
  generateNumericPin,
  generateSecurePassword,
  readAdminApiError,
  type OneTimeSecret,
} from "./admin-credential-utils";

export type CredentialAddKind = "ports" | "managers" | "reports" | "admins";

type AuthPortOption = {
  id: string;
  code: string;
  name: string;
};

const ADD_OPTIONS: { kind: CredentialAddKind; title: string; description: string }[] = [
  {
    kind: "ports",
    title: "Port",
    description: "Staff login (port code + password), login email, and access register PIN",
  },
  {
    kind: "managers",
    title: "Manager",
    description: "Hub and manager portal login with assigned ports",
  },
  {
    kind: "reports",
    title: "Reports user",
    description: "Read-only movement reports login",
  },
  {
    kind: "admins",
    title: "Platform admin",
    description: "Access to this admin console",
  },
];

export function AdminCredentialAddModal({
  initialKind,
  onClose,
  onSaved,
  onSecretsRevealed,
}: {
  initialKind: CredentialAddKind | null;
  onClose: () => void;
  onSaved: () => void;
  onSecretsRevealed: (secrets: OneTimeSecret[]) => void;
}) {
  const [kind, setKind] = useState<CredentialAddKind | null>(initialKind);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ports, setPorts] = useState<AuthPortOption[]>([]);

  const [portCode, setPortCode] = useState("");
  const [portName, setPortName] = useState("");
  const [portEmail, setPortEmail] = useState("");
  const [portPassword, setPortPassword] = useState("");
  const [portPin, setPortPin] = useState("");

  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerPortIds, setManagerPortIds] = useState<string[]>([]);

  const [reportsEmail, setReportsEmail] = useState("");
  const [reportsPassword, setReportsPassword] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const loadPorts = useCallback(async () => {
    const res = await fetch("/api/admin/auth-ports");
    if (!res.ok) return;
    const data = (await res.json()) as { ports: AuthPortOption[] };
    setPorts(data.ports);
  }, []);

  useEffect(() => {
    if (kind === "managers") void loadPorts();
  }, [kind, loadPorts]);

  async function submitPort(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const code = portCode.trim().toUpperCase();
    const res = await fetch("/api/admin/ports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        name: portName.trim(),
        loginEmail: portEmail.trim(),
        password: portPassword,
        accessPin: portPin,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readAdminApiError(res, "Create failed"));
      return;
    }
    onSecretsRevealed([
      { label: "Port code", value: code },
      { label: "Shared password", value: portPassword },
      { label: "Access register PIN", value: portPin },
      { label: "Port login email", value: portEmail.trim() },
    ]);
    onSaved();
  }

  async function submitManager(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const email = managerEmail.trim();
    const res = await fetch("/api/admin/managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: managerPassword,
        authPortIds: managerPortIds,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readAdminApiError(res, "Create failed"));
      return;
    }
    onSecretsRevealed([
      { label: "Manager email", value: email },
      { label: "Password", value: managerPassword },
    ]);
    onSaved();
  }

  async function submitReports(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const email = reportsEmail.trim();
    const res = await fetch("/api/admin/reports-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: reportsPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readAdminApiError(res, "Create failed"));
      return;
    }
    onSecretsRevealed([
      { label: "Reports email", value: email },
      { label: "Password", value: reportsPassword },
    ]);
    onSaved();
  }

  async function submitAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const email = adminEmail.trim();
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: adminPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Create failed");
      return;
    }
    onSecretsRevealed([
      { label: "Admin email", value: email },
      { label: "Password", value: adminPassword },
    ]);
    onSaved();
  }

  function toggleManagerPort(portId: string) {
    setManagerPortIds((prev) =>
      prev.includes(portId) ? prev.filter((id) => id !== portId) : [...prev, portId]
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-credential-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h2 id="add-credential-title" className="text-lg font-semibold text-slate-900">
            {kind ? `Add ${ADD_OPTIONS.find((o) => o.kind === kind)?.title}` : "Add credential"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>
        </div>

        {!kind ? (
          <ul className="mt-4 space-y-2">
            {ADD_OPTIONS.map((option) => (
              <li key={option.kind}>
                <button
                  type="button"
                  onClick={() => setKind(option.kind)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{option.title}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{option.description}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : kind === "ports" ? (
          <form onSubmit={(e) => void submitPort(e)} className="mt-4 space-y-3">
            <label className="block text-sm">
              Port code
              <input
                required
                value={portCode}
                onChange={(e) => setPortCode(e.target.value.toUpperCase())}
                placeholder="e.g. KGC"
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 uppercase"
              />
            </label>
            <label className="block text-sm">
              Display name
              <input
                required
                value={portName}
                onChange={(e) => setPortName(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="block text-sm">
              Port login email
              <input
                type="email"
                required
                value={portEmail}
                onChange={(e) => setPortEmail(e.target.value)}
                placeholder="ops@port.example"
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <SecretInputRow
              label="Shared password"
              required
              minLength={8}
              value={portPassword}
              onChange={setPortPassword}
              onGenerate={() => setPortPassword(generateSecurePassword())}
            />
            <SecretInputRow
              label="Access register PIN"
              required
              inputMode="numeric"
              pattern="\d{4,8}"
              minLength={4}
              maxLength={8}
              value={portPin}
              onChange={setPortPin}
              onGenerate={() => setPortPin(generateNumericPin())}
              hint="4–8 digits for hub Access register tab"
            />
            <Button type="submit" disabled={busy} className="text-sm">
              Create port
            </Button>
          </form>
        ) : kind === "managers" ? (
          <form onSubmit={(e) => void submitManager(e)} className="mt-4 space-y-3">
            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <SecretInputRow
              label="Password"
              required
              minLength={8}
              value={managerPassword}
              onChange={setManagerPassword}
              onGenerate={() => setManagerPassword(generateSecurePassword())}
            />
            <fieldset>
              <legend className="text-sm font-medium">Assigned ports</legend>
              {ports.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">Create a port first.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-3">
                  {ports.map((port) => (
                    <label key={port.id} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={managerPortIds.includes(port.id)}
                        onChange={() => toggleManagerPort(port.id)}
                      />
                      {port.code}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <Button type="submit" disabled={busy || managerPortIds.length === 0} className="text-sm">
              Create manager
            </Button>
          </form>
        ) : kind === "reports" ? (
          <form onSubmit={(e) => void submitReports(e)} className="mt-4 space-y-3">
            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={reportsEmail}
                onChange={(e) => setReportsEmail(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <SecretInputRow
              label="Password"
              required
              minLength={8}
              value={reportsPassword}
              onChange={setReportsPassword}
              onGenerate={() => setReportsPassword(generateSecurePassword())}
            />
            <Button type="submit" disabled={busy} className="text-sm">
              Create reports user
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => void submitAdmin(e)} className="mt-4 space-y-3">
            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
              />
            </label>
            <SecretInputRow
              label="Password"
              required
              minLength={8}
              value={adminPassword}
              onChange={setAdminPassword}
              onGenerate={() => setAdminPassword(generateSecurePassword())}
            />
            <Button type="submit" disabled={busy} className="text-sm">
              Create admin account
            </Button>
          </form>
        )}

        {kind ? (
          <button
            type="button"
            onClick={() => setKind(null)}
            className="mt-4 text-sm text-slate-500 underline hover:text-slate-700"
          >
            ← Choose a different type
          </button>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
