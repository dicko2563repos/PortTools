import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AdminAdminsPanel,
  AdminChangePasswordForm,
  AdminManagersPanel,
} from "@porttools/ui";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/session";
import { ACCESS_APP_URL } from "@/lib/support";

export default async function AdminConsolePage() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Admin console</h1>
          <p className="text-sm text-slate-600">{session.email}</p>
        </div>
        <LogoutButton />
      </header>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-sm">
        <span className="rounded bg-slate-900 px-3 py-1 text-white">Platform</span>
        <Link
          href={ACCESS_APP_URL}
          className="rounded bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200"
        >
          Open Access register →
        </Link>
        <span className="rounded bg-slate-100 px-3 py-1 text-slate-500">PCR (soon)</span>
        <span className="rounded bg-slate-100 px-3 py-1 text-slate-500">PMS (soon)</span>
      </nav>

      <div className="space-y-12">
        <AdminChangePasswordForm />
        <AdminAdminsPanel currentAdminId={session.adminId} />
        <AdminManagersPanel />
      </div>
    </main>
  );
}
