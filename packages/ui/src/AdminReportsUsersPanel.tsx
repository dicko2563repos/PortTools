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
  receivePmsReports: boolean;
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
  const [receiveBusyId, setReceiveBusyId] = useState<string | null>(null);
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

  async function patchUser(
    user: ReportsUserDto,
    body: { isActive?: boolean; receivePmsReports?: boolean },
    busyId: string,
    successMessage: string
  ) {
    setToggleBusyId(body.isActive !== undefined ? busyId : null);
    setReceiveBusyId(body.receivePmsReports !== undefined ? busyId : null);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/reports-users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setToggleBusyId(null);
    setReceiveBusyId(null);

    if (!res.ok) {
      setError(await readAdminApiError(res, "Update failed"));
      return;
    }

    setMessage(successMessage);
    await load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Cross-port read-only movement reporting. Users sign in at porttools.com.au or the PMS
        reports page. Tick <strong>Receive PMS reports</strong> to email period Excel files when
        any port sends a report.
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
              <div className="space-y-2">
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
                      onClick={() =>
                        void patchUser(
                          user,
                          { isActive: !user.isActive },
                          user.id,
                          user.isActive ? "Reports user disabled" : "Reports user enabled"
                        )
                      }
                      className="text-sm text-slate-600 underline hover:no-underline disabled:opacity-50"
                    >
                      {user.isActive ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={user.receivePmsReports}
                    disabled={!user.isActive || receiveBusyId === user.id}
                    onChange={(e) =>
                      void patchUser(
                        user,
                        { receivePmsReports: e.target.checked },
                        user.id,
                        e.target.checked
                          ? "Will receive PMS report emails"
                          : "PMS report emails turned off"
                      )
                    }
                  />
                  <span>Receive PMS reports</span>
                </label>
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
