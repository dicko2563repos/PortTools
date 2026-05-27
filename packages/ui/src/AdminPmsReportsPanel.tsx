import { cn } from "./cn";

export type AdminPmsReportsPanelProps = {
  reportsUrl: string;
};

export function AdminPmsReportsPanel({ reportsUrl }: AdminPmsReportsPanelProps) {
  return (
    <section className="space-y-4">
      <h2 className="font-medium">Movement reports</h2>
      <p className="text-sm text-slate-600">
        Cross-port read-only preview and Excel export for bi-weekly movement periods. Report email
        recipients are managed under <strong>Platform → Reports users</strong>.
      </p>
      <a
        href={reportsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm transition-colors hover:bg-white"
        )}
      >
        Open movement reports →
      </a>
    </section>
  );
}
