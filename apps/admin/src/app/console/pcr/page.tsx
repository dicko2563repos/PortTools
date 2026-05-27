import { AdminPcrTemplatesPanel } from "@porttools/ui";
import { AdminPcrRecordsLinks } from "@/components/AdminPcrRecordsLinks";

export default function AdminPcrPage() {
  return (
    <div className="space-y-12">
      <AdminPcrTemplatesPanel />
      <AdminPcrRecordsLinks />
      <section className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
        <strong className="text-slate-900">Future:</strong> standardized master Excel import for
        offline disaster-recovery copies — not part of day-to-day port rollout.
      </section>
    </div>
  );
}
