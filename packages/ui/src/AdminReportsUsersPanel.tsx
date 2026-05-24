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

export type ReportsUserDto = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export type AdminReportsUsersPanelProps = Record<string, never>;

export function AdminReportsUsersPanel(_props: AdminReportsUsersPanelProps) {
  const [users, setUsers] = useState<ReportsUserDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);

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
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setMessage(null);

    const form = new FormData(formEl);
    const res = await fetch("/api/admin/reports-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      setError(await readApiError(res, "Create failed"));
      return;
    }

    setMessage("Reports user created");
    formEl.reset();
    await load();
  }

  async function onEdit(e: React.FormEvent<HTMLFormElement>, userId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEditBusy(true);
    setError(null);
    setMessage(null);

    const password = String(form.get("password") ?? "").trim();
    const res = await fetch(`/api/admin/reports-users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(password.length > 0 ? { password } : {}),
      }),
    });

    setEditBusy(false);

    if (!res.ok) {
      setError(await readApiError(res, "Update failed"));
      return;
    }

    setMessage("Reports user updated");
    setEditingId(null);
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
      setError(await readApiError(res, "Update failed"));
      return;
    }

    setMessage(user.isActive ? "Reports user disabled" : "Reports user enabled");
    await load();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-medium">Reports users</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cross-port read-only movement reporting. Users sign in at porttools.com.au (same login
          form as port operators) or the PMS reports login page.
        </p>
        <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
          {users.length === 0 && (
            <li className="p-3 text-sm text-slate-500">No reports users yet</li>
          )}
          {users.map((user) => (
            <li key={user.id} className="p-3">
              {editingId === user.id ? (
                <form onSubmit={(e) => onEdit(e, user.id)} className="space-y-2">
                  <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  <input
                    name="password"
                    type="password"
                    placeholder="New password (min 8 chars)"
                    minLength={8}
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
                      onClick={() => setEditingId(user.id)}
                      className="text-sm text-slate-600 underline hover:no-underline"
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      disabled={toggleBusyId === user.id}
                      onClick={() => toggleActive(user)}
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
      </section>

      <section>
        <h2 className="font-medium">Add reports user</h2>
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
            Create reports user
          </Button>
        </form>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
