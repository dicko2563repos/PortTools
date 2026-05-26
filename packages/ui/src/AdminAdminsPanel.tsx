"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { SecretInputRow } from "./SecretInputRow";
import {
  generateSecurePassword,
  type AdminCredentialPanelProps,
} from "./admin-credential-utils";

type AdminDto = {
  id: string;
  email: string;
  createdAt: string;
};

export type AdminAdminsPanelProps = AdminCredentialPanelProps & {
  currentAdminId: string;
};

export function AdminAdminsPanel({
  currentAdminId,
  reloadToken = 0,
  onSecretsRevealed,
}: AdminAdminsPanelProps) {
  const [admins, setAdmins] = useState<AdminDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/admins");
    if (!res.ok) {
      setError("Failed to load admin accounts");
      return;
    }
    const data = (await res.json()) as { admins: AdminDto[] };
    setAdmins(data.admins);
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  async function onEdit(e: React.FormEvent<HTMLFormElement>, admin: AdminDto) {
    e.preventDefault();
    setEditBusy(true);
    setError(null);
    setMessage(null);

    const password = editPassword.trim();
    if (password.length < 8) {
      setEditBusy(false);
      setError("Password must be at least 8 characters.");
      return;
    }

    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setEditBusy(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Update failed");
      return;
    }

    onSecretsRevealed?.([{ label: `${admin.email} — new password`, value: password }]);
    setMessage("Admin password updated");
    setEditingId(null);
    setEditPassword("");
    await load();
  }

  async function removeAdmin(admin: AdminDto) {
    if (admin.id === currentAdminId) {
      setError("You cannot remove your own account while signed in.");
      return;
    }

    if (
      !window.confirm(
        `Remove admin account ${admin.email}? They will no longer be able to sign in.`
      )
    ) {
      return;
    }

    setDeleteBusyId(admin.id);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    setDeleteBusyId(null);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Remove failed");
      return;
    }

    setMessage("Admin account removed");
    await load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Platform admins can sign in to this console and legacy PCR/PMS admin routes. At least one
        admin must remain.
      </p>
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {admins.length === 0 && (
          <li className="p-3 text-sm text-slate-500">No admin accounts found</li>
        )}
        {admins.map((admin) => (
          <li key={admin.id} className="p-3">
            {editingId === admin.id ? (
              <form onSubmit={(e) => void onEdit(e, admin)} className="space-y-2">
                <p className="text-sm font-medium text-slate-900">{admin.email}</p>
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
                  <span className="font-medium">{admin.email}</span>
                  {admin.id === currentAdminId && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      You
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(admin.id);
                      setEditPassword("");
                    }}
                    className="text-sm text-slate-600 underline hover:no-underline"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    disabled={deleteBusyId === admin.id || admin.id === currentAdminId}
                    onClick={() => void removeAdmin(admin)}
                    className="text-sm text-slate-600 underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
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
