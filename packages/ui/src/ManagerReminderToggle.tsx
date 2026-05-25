"use client";

import { useState } from "react";

export type ManagerReminderToggleProps = {
  label: string;
  description: string;
  enabled: boolean;
  settingsUrl: string;
  field: "complianceReminderEmailsEnabled" | "asicReminderEmailsEnabled";
  loginEmail: string | null;
};

export function ManagerReminderToggle({
  label,
  description,
  enabled: initialEnabled,
  settingsUrl,
  field,
  loginEmail,
}: ManagerReminderToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onChange(next: boolean) {
    if (!loginEmail) {
      setError("Port login email is not set. Ask a platform admin to configure it.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const res = await fetch(settingsUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });

    setBusy(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not save reminder preference");
      return;
    }

    setEnabled(next);
    setMessage(next ? "Email reminders enabled" : "Email reminders disabled");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={enabled}
          disabled={busy || !loginEmail}
          onChange={(e) => void onChange(e.target.checked)}
        />
        <span>
          <span className="font-medium text-slate-900">{label}</span>
          <span className="mt-1 block text-slate-600">{description}</span>
          {!loginEmail && (
            <span className="mt-1 block text-amber-800">
              Port login email required before reminders can be sent.
            </span>
          )}
        </span>
      </label>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      {message && <p className="mt-2 text-green-700">{message}</p>}
    </section>
  );
}
