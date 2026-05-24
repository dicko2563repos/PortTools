"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";

type AdminDto = {
  id: string;
  email: string;
  createdAt: string;
};

export type AdminAdminsPanelProps = {
  currentAdminId: string;
};

export function AdminAdminsPanel({ currentAdminId }: AdminAdminsPanelProps) {
  const [admins, setAdmins] = useState<AdminDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);

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
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setMessage(null);

    const form = new FormData(formEl);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Create failed");
      return;
    }

    setMessage("Admin account created");
    formEl.reset();
    await load();
  }

  async function onEdit(e: React.FormEvent<HTMLFormElement>, adminId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEditBusy(true);
    setError(null);
    setMessage(null);

    const password = String(form.get("password") ?? "").trim();
    const res = await fetch(`/api/admin/admins/${adminId}`, {
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

    setMessage("Admin password updated");
    setEditingId(null);
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
    <div className="space-y-8">
      <section>
        <h2 className="font-medium">Admin accounts</h2>
        <p className="mt-1 text-sm text-slate-600">
          Shared across Port Compliance Record and Port Movement Summary. At least one admin
          must remain.
        </p>
        <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
          {admins.length === 0 && (
            <li className="p-3 text-sm text-slate-500">No admin accounts found</li>
          )}
          {admins.map((admin) => (
            <li key={admin.id} className="p-3">
              {editingId === admin.id ? (
                <form onSubmit={(e) => onEdit(e, admin.id)} className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">{admin.email}</p>
                  <input
                    name="password"
                    type="password"
                    placeholder="New password (min 8 chars)"
                    minLength={8}
                    required
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={editBusy} className="px-3 py-1 text-sm">
                      Save password
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
                      onClick={() => setEditingId(admin.id)}
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
      </section>

      <section>
        <h2 className="font-medium">Add admin</h2>
        <form
          onSubmit={onCreate}
          className="mt-2 space-y-2 rounded border border-slate-200 bg-white p-4"
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
          <Button type="submit" className="text-sm">
            Create admin account
          </Button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
