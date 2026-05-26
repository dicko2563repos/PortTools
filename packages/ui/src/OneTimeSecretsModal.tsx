"use client";

import { useState } from "react";
import { Button } from "./Button";
import type { OneTimeSecret } from "./admin-credential-utils";

export function OneTimeSecretsModal({
  secrets,
  onClose,
}: {
  secrets: OneTimeSecret[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const text = secrets.map((item) => `${item.label}: ${item.value}`).join("\n");

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="one-time-secrets-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <h2 id="one-time-secrets-title" className="text-lg font-semibold text-slate-900">
          Save these credentials now
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          They will not be shown again. Copy them to a password manager or secure handoff for
          the port.
        </p>
        <dl className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          {secrets.map((item) => (
            <div key={item.label}>
              <dt className="font-medium text-slate-700">{item.label}</dt>
              <dd className="mt-0.5 font-mono text-slate-900 break-all">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" className="text-sm" onClick={() => void copyAll()}>
            {copied ? "Copied" : "Copy all"}
          </Button>
          <Button type="button" variant="secondary" className="text-sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
