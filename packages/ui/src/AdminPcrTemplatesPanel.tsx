"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";

type TemplateRow = {
  id: string;
  version: number;
  name: string;
  isActive: boolean;
  publishedAt: string;
};

export type AdminPcrTemplatesPanelProps = {
  templatesApiPath?: string;
};

export function AdminPcrTemplatesPanel({
  templatesApiPath = "/api/admin/pcr/templates",
}: AdminPcrTemplatesPanelProps) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(templatesApiPath);
    if (!res.ok) {
      setError("Failed to load templates");
      return;
    }
    const data = (await res.json()) as { templates: TemplateRow[] };
    setTemplates(data.templates);
  }, [templatesApiPath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publishClone() {
    setPublishing(true);
    setError(null);
    setMessage(null);
    const res = await fetch(templatesApiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cloneActive: true }),
    });
    setPublishing(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Publish failed");
      return;
    }
    const data = (await res.json()) as { template: TemplateRow };
    setMessage(`Published ${data.template.name} (v${data.template.version})`);
    await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="font-medium">Inspection templates</h2>
      <p className="text-sm text-slate-600">
        New compliance records use the <strong>active</strong> template. Existing drafts keep
        the version from when the year was created.
      </p>

      <ul className="divide-y rounded border border-slate-200 bg-white">
        {templates.length === 0 && (
          <li className="p-3 text-sm text-slate-500">No templates published yet.</li>
        )}
        {templates.map((t) => (
          <li key={t.id} className="flex justify-between gap-4 p-3 text-sm">
            <span>
              <strong>v{t.version}</strong> — {t.name}
            </span>
            <span className={t.isActive ? "font-medium text-green-700" : "text-slate-400"}>
              {t.isActive ? "Active" : "—"}
            </span>
          </li>
        ))}
      </ul>

      <Button type="button" disabled={publishing} onClick={() => void publishClone()}>
        {publishing ? "Publishing…" : "Publish new version (clone active layout)"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </section>
  );
}
