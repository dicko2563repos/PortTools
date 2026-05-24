import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { listManagerPorts } from "@/lib/access-register";
import { getSession } from "@/lib/session";

export default async function PortsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.type === "port") {
    redirect(`/ports/${session.movementsPortId}/access`);
  }

  const ports = await listManagerPorts(session);

  if (ports.length === 1) {
    redirect(`/ports/${ports[0]!.movementsPortId}/access`);
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Choose port</h1>
          <p className="text-sm text-slate-600">{session.email}</p>
        </div>
        <LogoutButton />
      </header>
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {ports.length === 0 && (
          <li className="p-4 text-sm text-slate-500">
            No ports assigned. Ask a platform admin to grant access.
          </li>
        )}
        {ports.map((port) => (
          <li key={port!.movementsPortId}>
            <Link
              href={`/ports/${port!.movementsPortId}/access`}
              className="block p-4 hover:bg-slate-50"
            >
              <span className="font-medium">{port!.code}</span>
              <span className="ml-2 text-sm text-slate-600">{port!.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
