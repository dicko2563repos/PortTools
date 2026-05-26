"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { SecretInputRow } from "./SecretInputRow";
import {
  generateSecurePassword,
  readAdminApiError,
  type AdminCredentialPanelProps,
} from "./admin-credential-utils";

export type ReportsUserDto = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminReportsUsersPanelProps = AdminCredentialPanelProps;

export function AdminReportsUsersPanel({
  reloadToken = 0,
  onSecretsRevealed,
}: AdminReportsUsersPanelProps) {
  const [users, setUsers] = useState<ReportsUserDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/reports-users");
    if (!res.ok) {
      setError("Failed to load reports users");
      return;
    }
    const data = (await res.json()) as { users: ReportsUserDto[] };
    setUsers(data.users);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  async function onEdit(e: React.FormEvent<HTMLFormElement>, user: ReportsUserDto) {
    e.preventDefault();
    setEditBusy(true);
    setError(null);
    setMessage(null);

    const password = editPassword.trim();
    if (password.length === 0) {
      setEditBusy(false);
      setError("Enter a new password or cancel.");
      return;
    }

    const res = await fetch(`/api/admin/reports-users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setEditBusy(false);

    if (!res.ok) {
      setError(await readAdminApiError(res, "Update failed"));
      return;
    }

    onSecretsRevealed?.([{ label: `${user.email} — new password`, value: password }]);
    setMessage("Reports user updated");
    setEditingId(null);
    setEditPassword("");
    await load();
  }

  async function toggleActive(user: ReportsUserDto) {
    setToggleBusyId(user.id);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/reports-users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });

    setToggleBusyId(null);

    if (!res.ok) {
      setError(await readAdminApiError(res, "Update failed"));
      return;
    }

    setMessage(user.isActive ? "Reports user disabled" : "Reports user enabled");
    await load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Cross-port read-only movement reporting. Users sign in at porttools.com.au or the PMS
        reports page.
      </p>
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {users.length === 0 && (
          <li className="p-3 text-sm text-slate-500">No reports users yet — use Add to create one.</li>
        )}
        {users.map((user) => (
          <li key={user.id} className="p-3">
            {editingId === user.id ? (
              <form onSubmit={(e) => void onEdit(e, user)} className="space-y-2">
                <p className="text-sm font-medium text-slate-900">{user.email}</p>
                <SecretInputRow
                  label="New password"
                  required
                  minLength={8}
                  value={editPassword}
                  onChange={setEditPassword}
                  onGenerate={() => setEditPassword(generateSecurePassword())}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={editBusy} className="px-3 py-1 text-sm">
                    Save password
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="font-medium">{user.email}</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {user.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(user.id);
                      setEditPassword("");
                    }}
                    className="text-sm text-slate-600 underline hover:no-underline"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    disabled={toggleBusyId === user.id}
                    onClick={() => void toggleActive(user)}
                    className="text-sm text-slate-600 underline hover:no-underline disabled:opacity-50"
                  >
                    {user.isActive ? "Disable" : "Enable"}
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
