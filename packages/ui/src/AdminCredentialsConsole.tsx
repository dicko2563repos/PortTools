"use client";

import { useState } from "react";
import { AdminAdminsPanel } from "./AdminAdminsPanel";
import { AdminAuthPortsPanel } from "./AdminAuthPortsPanel";
import { AdminCredentialAddModal, type CredentialAddKind } from "./AdminCredentialAddModal";
import { AdminManagersPanel } from "./AdminManagersPanel";
import { AdminReportsUsersPanel } from "./AdminReportsUsersPanel";
import { Button } from "./Button";
import { OneTimeSecretsModal } from "./OneTimeSecretsModal";
import type { OneTimeSecret } from "./admin-credential-utils";

export type CredentialTab = CredentialAddKind;

const TABS: { id: CredentialTab; label: string }[] = [
  { id: "ports", label: "Ports" },
  { id: "managers", label: "Managers" },
  { id: "reports", label: "Reports" },
  { id: "admins", label: "Admins" },
];

export type AdminCredentialsConsoleProps = {
  currentAdminId: string;
};

export function AdminCredentialsConsole({ currentAdminId }: AdminCredentialsConsoleProps) {
  const [tab, setTab] = useState<CredentialTab>("ports");
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<CredentialAddKind | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [secrets, setSecrets] = useState<OneTimeSecret[] | null>(null);

  function revealSecrets(items: OneTimeSecret[]) {
    if (items.length > 0) setSecrets(items);
  }

  function openAdd(kind?: CredentialAddKind) {
    setAddKind(kind ?? null);
    setAddOpen(true);
  }

  function onSaved() {
    setAddOpen(false);
    setAddKind(null);
    setReloadToken((value) => value + 1);
  }

  const panelProps = {
    reloadToken,
    onSecretsRevealed: revealSecrets,
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-medium">Credentials</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage logins for ports, managers, reports users, and platform admins. Passwords and
          PINs can only be set or reset — never viewed again after saving.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Credential types">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                tab === item.id
                  ? "rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
                  : "rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
              }
            >
              {item.label}
            </button>
          ))}
        </nav>
        <Button type="button" className="text-sm" onClick={() => openAdd(tab)}>
          + Add
        </Button>
      </div>

      {tab === "ports" ? <AdminAuthPortsPanel {...panelProps} /> : null}
      {tab === "managers" ? <AdminManagersPanel {...panelProps} /> : null}
      {tab === "reports" ? <AdminReportsUsersPanel {...panelProps} /> : null}
      {tab === "admins" ? (
        <AdminAdminsPanel currentAdminId={currentAdminId} {...panelProps} />
      ) : null}

      {addOpen ? (
        <AdminCredentialAddModal
          initialKind={addKind}
          onClose={() => {
            setAddOpen(false);
            setAddKind(null);
          }}
          onSaved={onSaved}
          onSecretsRevealed={revealSecrets}
        />
      ) : null}

      {secrets ? (
        <OneTimeSecretsModal secrets={secrets} onClose={() => setSecrets(null)} />
      ) : null}
    </section>
  );
}
