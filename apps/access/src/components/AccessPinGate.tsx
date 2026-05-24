"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@porttools/ui";

type PortInfo = { id: string; code: string; name: string };

export function AccessPinGate({
  port,
  pinConfigured,
}: {
  port: PortInfo;
  pinConfigured: boolean;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const res = await fetch(`/api/ports/${port.id}/access/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setBusy(false);

    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Incorrect PIN");
      } catch {
        setError("Incorrect PIN");
      }
      return;
    }

    router.refresh();
  }

  if (!pinConfigured) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="text-xl font-semibold">Access register</h1>
        <p className="mt-2 text-sm text-slate-600">
          {port.code} — {port.name}
        </p>
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No access PIN is set for this port yet. Ask a platform admin to set one in the
          admin console before you can open the register.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-xl font-semibold">Enter access PIN</h1>
      <p className="mt-2 text-sm text-slate-600">
        {port.code} — {port.name}
      </p>
      <p className="mt-4 text-sm text-slate-600">
        Port operators need the register PIN to view and update staff ASIC and FOB records.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          PIN
          <Input
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            required
            minLength={4}
            maxLength={8}
            pattern="\d{4,8}"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="tracking-widest"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "Checking…" : "Continue"}
        </Button>
      </form>
    </main>
  );
}
