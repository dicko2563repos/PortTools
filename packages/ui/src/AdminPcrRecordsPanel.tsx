"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PortDto = { id: string; code: string; name: string };

type RecordRow = {
  id: string;
  year: number;
  templateVersion: { version: number; name: string };
};

const DEFAULT_PORTS_API_PATH = "/api/admin/pcr/ports";
const DEFAULT_APP_LINK_API_PATH = "/api/admin/app-link";

function defaultRecordsApiPath(portId: string): string {
  return `/api/admin/pcr/ports/${portId}/records`;
}

function defaultRecordOpenUrl(recordId: string): string {
  return `/admin/records/${recordId}`;
}

function defaultRecordExportUrl(recordId: string): string {
  return `/api/records/${recordId}/export`;
}

export type AdminPcrRecordsPanelProps = {
  portsApiPath?: string;
  recordsApiPath?: (portId: string) => string;
  recordOpenUrl?: (recordId: string) => string;
  recordExportUrl?: (recordId: string) => string;
  /** When set, Open/Export fetch `/api/admin/app-link` instead of using static URLs. */
  appLinkApp?: "pcr";
  appLinkApiPath?: string;
};

export function AdminPcrRecordsPanel({
  portsApiPath = DEFAULT_PORTS_API_PATH,
  recordsApiPath = defaultRecordsApiPath,
  recordOpenUrl = defaultRecordOpenUrl,
  recordExportUrl = defaultRecordExportUrl,
  appLinkApp,
  appLinkApiPath = DEFAULT_APP_LINK_API_PATH,
}: AdminPcrRecordsPanelProps) {
  const [ports, setPorts] = useState<PortDto[]>([]);
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadPorts = useCallback(async () => {
    const res = await fetch(portsApiPath);
    if (!res.ok) {
      setError("Failed to load ports");
      return;
    }
    const data = (await res.json()) as { ports: PortDto[] };
    setPorts(data.ports);
    setSelectedPortId((current) => current ?? data.ports[0]?.id ?? null);
  }, [portsApiPath]);

  const loadRecords = useCallback(async (portId: string) => {
    setLoadingRecords(true);
    setError(null);
    const res = await fetch(recordsApiPath(portId));
    setLoadingRecords(false);
    if (!res.ok) {
      setError("Failed to load compliance records");
      return;
    }
    const data = (await res.json()) as { records: RecordRow[] };
    setRecords(data.records);
  }, [recordsApiPath]);

  useEffect(() => {
    void loadPorts();
  }, [loadPorts]);

  useEffect(() => {
    if (selectedPortId) void loadRecords(selectedPortId);
  }, [selectedPortId, loadRecords]);

  const selectedPort = ports.find((p) => p.id === selectedPortId) ?? null;

  async function openAppLink(path: string) {
    if (!appLinkApp) return;
    const res = await fetch(
      `${appLinkApiPath}?app=${encodeURIComponent(appLinkApp)}&path=${encodeURIComponent(path)}`
    );
    if (!res.ok) {
      setError("Could not open link");
      return;
    }
    const data = (await res.json()) as { url?: string };
    if (!data.url) {
      setError("Could not open link");
      return;
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="space-y-4">
      <h2 className="font-medium">Compliance records</h2>
      <p className="text-sm text-slate-600">
        View-only access to any port&apos;s yearly compliance record. Port staff edit records on
        the operator portal.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Port</span>
          <select
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            value={selectedPortId ?? ""}
            onChange={(e) => setSelectedPortId(e.target.value || null)}
          >
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loadingRecords && <p className="text-sm text-slate-500">Loading records…</p>}

      {!loadingRecords && selectedPort && (
        <ul className="divide-y rounded border border-slate-200 bg-white">
          {records.length === 0 && (
            <li className="p-4 text-sm text-slate-500">
              No records for {selectedPort.code} yet.
            </li>
          )}
          {records.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span>
                <strong>{r.year}</strong>
                <span className="ml-2 text-slate-500">tpl v{r.templateVersion.version}</span>
              </span>
              <span className="flex gap-3">
                {appLinkApp ? (
                  <>
                    <button
                      type="button"
                      className="font-medium text-slate-900 hover:underline"
                      onClick={() => void openAppLink(`/admin/records/${r.id}`)}
                    >
                      Open →
                    </button>
                    <button
                      type="button"
                      className="text-slate-600 hover:underline"
                      onClick={() => void openAppLink(`/api/records/${r.id}/export`)}
                    >
                      Excel ↓
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={recordOpenUrl(r.id)}
                      className="font-medium text-slate-900 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open →
                    </Link>
                    <a
                      href={recordExportUrl(r.id)}
                      className="text-slate-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Excel ↓
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
