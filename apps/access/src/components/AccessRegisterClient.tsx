"use client";

import { readApiError } from "@/lib/client-api-error";
import { asicExpiryToMonthInputValue } from "@/lib/asic-expiry";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@porttools/ui";

type PortInfo = { id: string; code: string; name: string };

type ManagerPortOption = {
  movementsPortId: string;
  code: string;
  name: string;
};

type StaffAsicDto = {
  id: string;
  name: string;
  asicNumber: string;
  expiryDate: string;
  notes: string;
  daysUntilExpiry: number;
  expiringSoon: boolean;
  expired: boolean;
  currentFob: { id: string; label: string } | null;
};

type OpenCheckoutDto = {
  id: string;
  holderType: "staff" | "visitor";
  visitorName: string;
  visitorOrganization: string;
  reason: string;
  notes: string;
  signedOutAt: string;
  staffAsic: { id: string; name: string; asicNumber: string } | null;
};

type FobDeviceDto = {
  id: string;
  label: string;
  notes: string;
  openCheckout: OpenCheckoutDto | null;
};

type DeletedFobDto = {
  id: string;
  label: string;
  notes: string;
  deletedAt: string;
};

type TimelineEntry =
  | {
      kind: "checkout";
      id: string;
      at: string;
      holderType: "staff" | "visitor";
      visitorName: string;
      visitorOrganization: string;
      reason: string;
      notes: string;
      signedOutAt: string;
      signedInAt: string | null;
      staffAsic: { id: string; name: string; asicNumber: string } | null;
    }
  | {
      kind: "renamed" | "deleted" | "restored";
      id: string;
      at: string;
      oldLabel: string | null;
      newLabel: string | null;
      notes: string;
      adminEmail: string;
    };

type Tab = "staff" | "fob" | "deleted";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatVisitorLabel(name: string, organization: string): string {
  return organization ? `${name} (${organization})` : name;
}

function FobHistoryPanel({
  label,
  history,
  historyLoading,
  onClose,
}: {
  label: string;
  history: TimelineEntry[];
  historyLoading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">{label} history</h3>
        <button
          type="button"
          className="text-sm text-slate-600 underline hover:no-underline"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {historyLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {!historyLoading && history.length === 0 && (
        <p className="text-sm text-slate-500">No history yet</p>
      )}
      <ul className="space-y-3">
        {history.map((entry) => (
          <li key={`${entry.kind}-${entry.id}`} className="border-l-2 border-slate-200 pl-3 text-sm">
            <p className="text-slate-500">{formatWhen(entry.at)}</p>
            {entry.kind === "checkout" ? (
              <div>
                <p className="font-medium">
                  {entry.signedInAt ? "Checkout (returned)" : "Signed out"}
                </p>
                {entry.holderType === "staff" && entry.staffAsic ? (
                  <p>
                    Staff: {entry.staffAsic.name} ({entry.staffAsic.asicNumber})
                  </p>
                ) : (
                  <p>
                    Visitor:{" "}
                    {formatVisitorLabel(entry.visitorName, entry.visitorOrganization)} —{" "}
                    {entry.reason}
                  </p>
                )}
                <p className="text-slate-600">
                  Out {formatWhen(entry.signedOutAt)}
                  {entry.signedInAt ? ` · In ${formatWhen(entry.signedInAt)}` : ""}
                </p>
                {entry.notes && <p className="text-slate-500">{entry.notes}</p>}
              </div>
            ) : entry.kind === "renamed" ? (
              <p>
                Renamed: {entry.oldLabel} → {entry.newLabel}
                {entry.adminEmail ? ` (${entry.adminEmail})` : ""}
              </p>
            ) : entry.kind === "deleted" ? (
              <p>Deleted{entry.adminEmail ? ` by ${entry.adminEmail}` : ""}</p>
            ) : (
              <p>Restored{entry.adminEmail ? ` by ${entry.adminEmail}` : ""}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function expiryBadge(record: StaffAsicDto) {
  if (record.expired) {
    return (
      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        Expired
      </span>
    );
  }
  if (record.expiringSoon) {
    return (
      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        Expires in {record.daysUntilExpiry}d
      </span>
    );
  }
  return null;
}

export function AccessRegisterClient({ port }: { port: PortInfo }) {
  const router = useRouter();
  const base = `/api/ports/${port.id}/access`;

  const [managerPorts, setManagerPorts] = useState<ManagerPortOption[]>([]);
  const [tab, setTab] = useState<Tab>("staff");
  const [staffAsicRecords, setStaffAsicRecords] = useState<StaffAsicDto[]>([]);
  const [fobDevices, setFobDevices] = useState<FobDeviceDto[]>([]);
  const [deletedFobDevices, setDeletedFobDevices] = useState<DeletedFobDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingFobId, setEditingFobId] = useState<string | null>(null);
  const [checkoutFobId, setCheckoutFobId] = useState<string | null>(null);
  const [historyFobId, setHistoryFobId] = useState<string | null>(null);
  const [history, setHistory] = useState<TimelineEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(base);
    if (!res.ok) {
      setError(await readApiError(res, "Failed to load access register"));
      return;
    }
    const data = (await res.json()) as {
      staffAsicRecords: StaffAsicDto[];
      fobDevices: FobDeviceDto[];
      deletedFobDevices: DeletedFobDto[];
    };
    setStaffAsicRecords(data.staffAsicRecords);
    setFobDevices(data.fobDevices);
    setDeletedFobDevices(data.deletedFobDevices);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/ports");
      if (!res.ok) return;
      const data = (await res.json()) as { ports: ManagerPortOption[] };
      setManagerPorts(data.ports);
    })();
  }, []);

  async function loadHistory(deviceId: string) {
    setHistoryLoading(true);
    setHistory([]);
    const res = await fetch(`${base}/fob-devices/${deviceId}/history`);
    setHistoryLoading(false);
    if (!res.ok) {
      setError("Failed to load FOB history");
      return;
    }
    const data = (await res.json()) as { timeline: TimelineEntry[] };
    setHistory(data.timeline);
  }

  function toggleHistory(deviceId: string) {
    if (historyFobId === deviceId) {
      setHistoryFobId(null);
      setHistory([]);
      return;
    }
    setHistoryFobId(deviceId);
    void loadHistory(deviceId);
  }

  function closeHistory() {
    setHistoryFobId(null);
    setHistory([]);
  }

  async function onCreateStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setMessage(null);
    setBusy(true);
    const form = new FormData(formEl);
    const res = await fetch(`${base}/staff-asic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        asicNumber: form.get("asicNumber"),
        expiryDate: form.get("expiryDate"),
        notes: form.get("notes"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Create failed"));
      return;
    }
    setMessage("Staff ASIC record added");
    formEl.reset();
    await load();
  }

  async function onEditStaff(e: React.FormEvent<HTMLFormElement>, recordId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/staff-asic/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        asicNumber: form.get("asicNumber"),
        expiryDate: form.get("expiryDate"),
        notes: form.get("notes"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Update failed"));
      return;
    }
    setMessage("Staff ASIC record updated");
    setEditingStaffId(null);
    await load();
  }

  async function deleteStaff(recordId: string) {
    if (!window.confirm("Delete this staff ASIC record?")) return;
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/staff-asic/${recordId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await readApiError(res, "Delete failed"));
      return;
    }
    setMessage("Staff ASIC record deleted");
    await load();
  }

  async function onCreateFob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setMessage(null);
    setBusy(true);
    const form = new FormData(formEl);
    const res = await fetch(`${base}/fob-devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        notes: form.get("notes"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Create failed"));
      return;
    }
    setMessage("FOB added");
    formEl.reset();
    await load();
  }

  async function onEditFob(e: React.FormEvent<HTMLFormElement>, deviceId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/fob-devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        notes: form.get("notes"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Update failed"));
      return;
    }
    setMessage("FOB updated");
    setEditingFobId(null);
    await load();
  }

  async function deleteFob(deviceId: string) {
    if (!window.confirm("Move this FOB to the deleted list? History is kept.")) return;
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/fob-devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete" }),
    });
    if (!res.ok) {
      setError(await readApiError(res, "Delete failed"));
      return;
    }
    setMessage("FOB deleted");
    await load();
  }

  async function restoreFob(deviceId: string) {
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/fob-devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    if (!res.ok) {
      setError(await readApiError(res, "Restore failed"));
      return;
    }
    setMessage("FOB restored");
    await load();
  }

  async function onCheckout(e: React.FormEvent<HTMLFormElement>, deviceId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const holderType = String(form.get("holderType"));
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/fob-checkouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fobDeviceId: deviceId,
        holderType,
        staffAsicRecordId: holderType === "staff" ? form.get("staffAsicRecordId") : undefined,
        visitorName: holderType === "visitor" ? form.get("visitorName") : undefined,
        visitorOrganization:
          holderType === "visitor" ? form.get("visitorOrganization") : undefined,
        reason: form.get("reason"),
        notes: form.get("notes"),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(await readApiError(res, "Sign out failed"));
      return;
    }
    setMessage("FOB signed out");
    setCheckoutFobId(null);
    await load();
  }

  async function returnFob(checkoutId: string) {
    setError(null);
    setMessage(null);
    const res = await fetch(`${base}/fob-checkouts/${checkoutId}/return`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setError(await readApiError(res, "Return failed"));
      return;
    }
    setMessage("FOB returned");
    await load();
  }

  const expiringStaff = staffAsicRecords.filter((r) => r.expiringSoon || r.expired);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">Access register</h1>
          {managerPorts.length > 1 ? (
            <label className="mt-2 block text-sm text-slate-600">
              Port
              <select
                value={port.id}
                onChange={(e) => router.push(`/ports/${e.target.value}/access`)}
                className="mt-1 block w-full max-w-xs rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-900"
              >
                {managerPorts.map((p) => (
                  <option key={p.movementsPortId} value={p.movementsPortId}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              {port.code} — {port.name}
            </p>
          )}
        </div>
      </header>

      <nav className="flex gap-2 border-b border-slate-200 pb-2">
        {(
          [
            ["staff", "Staff ASIC"],
            ["fob", "FOB register"],
            ["deleted", "Deleted FOBs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "staff" && (
        <div className="space-y-8">
          {expiringStaff.length > 0 && (
            <section className="rounded border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-sm font-medium text-amber-950">Expiring soon</h2>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {expiringStaff.map((r) => (
                  <li key={r.id}>
                    {r.name} — expires {r.expiryDate} {expiryBadge(r)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-medium">Staff ASIC records</h2>
            <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
              {staffAsicRecords.length === 0 && (
                <li className="p-3 text-sm text-slate-500">No staff records yet</li>
              )}
              {staffAsicRecords.map((record) => (
                <li key={record.id} className="p-3">
                  {editingStaffId === record.id ? (
                    <form onSubmit={(e) => onEditStaff(e, record.id)} className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          name="name"
                          defaultValue={record.name}
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                          required
                        />
                        <input
                          name="asicNumber"
                          defaultValue={record.asicNumber}
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                          required
                        />
                        <input
                          name="expiryDate"
                          type="month"
                          defaultValue={asicExpiryToMonthInputValue(record.expiryDate)}
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                          required
                          aria-label="Expiry month"
                        />
                        <input
                          name="notes"
                          defaultValue={record.notes}
                          placeholder="Notes"
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={busy} className="px-3 py-1 text-sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3 py-1 text-sm"
                          onClick={() => setEditingStaffId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{record.name}</span>
                          {expiryBadge(record)}
                        </div>
                        <p className="text-sm text-slate-600">ASIC {record.asicNumber}</p>
                        <p className="text-sm text-slate-600">Expires {record.expiryDate}</p>
                        {record.currentFob && (
                          <p className="text-sm text-slate-700">
                            FOB out: <span className="font-medium">{record.currentFob.label}</span>
                          </p>
                        )}
                        {record.notes && (
                          <p className="mt-1 text-sm text-slate-500">{record.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 text-sm">
                        <button
                          type="button"
                          className="text-slate-600 underline hover:no-underline"
                          onClick={() => setEditingStaffId(record.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-red-700 underline hover:no-underline"
                          onClick={() => deleteStaff(record.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-medium">Add staff ASIC</h2>
            <form
              onSubmit={onCreateStaff}
              className="mt-2 space-y-2 rounded border border-slate-200 bg-white p-4"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-sm">
                  Name
                  <input
                    name="name"
                    required
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                  />
                </label>
                <label className="block text-sm">
                  ASIC number
                  <input
                    name="asicNumber"
                    required
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                  />
                </label>
                <label className="block text-sm">
                  Expiry (MM/YY)
                  <input
                    name="expiryDate"
                    type="month"
                    required
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                    aria-label="Expiry month"
                  />
                </label>
                <label className="block text-sm">
                  Notes
                  <input
                    name="notes"
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                  />
                </label>
              </div>
              <Button type="submit" disabled={busy} className="text-sm">
                Add staff record
              </Button>
            </form>
          </section>
        </div>
      )}

      {tab === "fob" && (
        <div className="space-y-8">
          <section>
            <h2 className="font-medium">FOB devices</h2>
            <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
              {fobDevices.length === 0 && (
                <li className="p-3 text-sm text-slate-500">No FOBs yet</li>
              )}
              {fobDevices.map((device) => (
                <li key={device.id} className="p-3">
                  {editingFobId === device.id ? (
                    <form onSubmit={(e) => onEditFob(e, device.id)} className="space-y-2">
                      <input
                        name="label"
                        defaultValue={device.label}
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        required
                      />
                      <input
                        name="notes"
                        defaultValue={device.notes}
                        placeholder="Notes"
                        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" disabled={busy} className="px-3 py-1 text-sm">
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3 py-1 text-sm"
                          onClick={() => setEditingFobId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="font-medium">{device.label}</span>
                          {device.openCheckout ? (
                            <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">
                              Out
                            </span>
                          ) : (
                            <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900">
                              Available
                            </span>
                          )}
                          {device.notes && (
                            <p className="mt-1 text-sm text-slate-500">{device.notes}</p>
                          )}
                          {device.openCheckout && (
                            <div className="mt-2 text-sm text-slate-700">
                              {device.openCheckout.holderType === "staff" &&
                              device.openCheckout.staffAsic ? (
                                <p>
                                  With {device.openCheckout.staffAsic.name} (staff) since{" "}
                                  {formatWhen(device.openCheckout.signedOutAt)}
                                </p>
                              ) : (
                                <p>
                                  Visitor{" "}
                                  {formatVisitorLabel(
                                    device.openCheckout.visitorName,
                                    device.openCheckout.visitorOrganization
                                  )}{" "}
                                  — {device.openCheckout.reason} (since{" "}
                                  {formatWhen(device.openCheckout.signedOutAt)})
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          {device.openCheckout ? (
                            <button
                              type="button"
                              className="text-slate-700 underline hover:no-underline"
                              onClick={() => returnFob(device.openCheckout!.id)}
                            >
                              Return
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="text-slate-700 underline hover:no-underline"
                              onClick={() =>
                                setCheckoutFobId(checkoutFobId === device.id ? null : device.id)
                              }
                            >
                              Sign out
                            </button>
                          )}
                          <button
                            type="button"
                            className="text-slate-600 underline hover:no-underline"
                            onClick={() => toggleHistory(device.id)}
                          >
                            {historyFobId === device.id ? "Close history" : "History"}
                          </button>
                          <button
                            type="button"
                            className="text-slate-600 underline hover:no-underline"
                            onClick={() => setEditingFobId(device.id)}
                          >
                            Edit
                          </button>
                          {!device.openCheckout && (
                            <button
                              type="button"
                              className="text-red-700 underline hover:no-underline"
                              onClick={() => deleteFob(device.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {checkoutFobId === device.id && (
                        <CheckoutForm
                          deviceId={device.id}
                          staffAsicRecords={staffAsicRecords}
                          busy={busy}
                          onSubmit={onCheckout}
                          onCancel={() => setCheckoutFobId(null)}
                        />
                      )}
                      {historyFobId === device.id && (
                        <FobHistoryPanel
                          label={device.label}
                          history={history}
                          historyLoading={historyLoading}
                          onClose={closeHistory}
                        />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-medium">Add FOB</h2>
            <form
              onSubmit={onCreateFob}
              className="mt-2 space-y-2 rounded border border-slate-200 bg-white p-4"
            >
              <label className="block text-sm">
                Label / tag ID
                <input
                  name="label"
                  required
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                />
              </label>
              <label className="block text-sm">
                Notes
                <input name="notes" className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
              </label>
              <Button type="submit" disabled={busy} className="text-sm">
                Add FOB
              </Button>
            </form>
          </section>
        </div>
      )}

      {tab === "deleted" && (
        <section>
          <h2 className="font-medium">Deleted FOBs</h2>
          <p className="mt-1 text-sm text-slate-600">
            History remains available after restore or while deleted.
          </p>
          <ul className="mt-2 divide-y rounded border border-slate-200 bg-white">
            {deletedFobDevices.length === 0 && (
              <li className="p-3 text-sm text-slate-500">No deleted FOBs</li>
            )}
            {deletedFobDevices.map((device) => (
              <li key={device.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-medium">{device.label}</span>
                    <p className="text-sm text-slate-500">
                      Deleted {formatWhen(device.deletedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      className="text-slate-600 underline hover:no-underline"
                      onClick={() => toggleHistory(device.id)}
                    >
                      {historyFobId === device.id ? "Close history" : "History"}
                    </button>
                    <button
                      type="button"
                      className="text-slate-700 underline hover:no-underline"
                      onClick={() => restoreFob(device.id)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
                {historyFobId === device.id && (
                  <FobHistoryPanel
                    label={device.label}
                    history={history}
                    historyLoading={historyLoading}
                    onClose={closeHistory}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}

function CheckoutForm({
  deviceId,
  staffAsicRecords,
  busy,
  onSubmit,
  onCancel,
}: {
  deviceId: string;
  staffAsicRecords: StaffAsicDto[];
  busy: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, deviceId: string) => void;
  onCancel: () => void;
}) {
  const [holderType, setHolderType] = useState<"staff" | "visitor">("staff");
  const availableStaff = staffAsicRecords.filter((s) => !s.currentFob);

  return (
    <form
      onSubmit={(e) => onSubmit(e, deviceId)}
      className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-3"
    >
      <fieldset className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="holderType"
            value="staff"
            checked={holderType === "staff"}
            onChange={() => setHolderType("staff")}
          />
          Staff
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="holderType"
            value="visitor"
            checked={holderType === "visitor"}
            onChange={() => setHolderType("visitor")}
          />
          Visitor
        </label>
      </fieldset>

      {holderType === "staff" ? (
        <label className="block text-sm">
          Staff member
          <select
            name="staffAsicRecordId"
            required
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
          >
            <option value="">Select…</option>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.asicNumber})
              </option>
            ))}
          </select>
        </label>
      ) : (
        <>
          <label className="block text-sm">
            Visitor name
            <input
              name="visitorName"
              required
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Organization
            <input
              name="visitorOrganization"
              required
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
          <label className="block text-sm">
            Reason
            <input
              name="reason"
              required
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
            />
          </label>
        </>
      )}

      {holderType === "staff" && (
        <label className="block text-sm">
          Reason (optional)
          <input name="reason" className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
        </label>
      )}

      <label className="block text-sm">
        Notes
        <input name="notes" className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>

      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="px-3 py-1 text-sm">
          Sign out FOB
        </Button>
        <Button type="button" variant="secondary" className="px-3 py-1 text-sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
