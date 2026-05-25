import { NextResponse } from "next/server";
import { redirect, notFound } from "next/navigation";
import { AccessPinGate } from "@/components/AccessPinGate";
import { AccessRegisterClient } from "@/components/AccessRegisterClient";
import { LogoutButton } from "@/components/LogoutButton";
import { requireManagerPort } from "@/lib/access-register";
import { authStore } from "@/lib/auth-store";
import { hasAccessPinUnlock } from "@/lib/access-pin-unlock";
import { tryEstablishSessionFromHubSso } from "@/lib/hub-sso";
import { getSession } from "@/lib/session";

type PageProps = {
  params: Promise<{ portId: string }>;
  searchParams: Promise<{ hub_sso?: string }>;
};

export default async function AccessRegisterPage({ params, searchParams }: PageProps) {
  const { hub_sso } = await searchParams;
  const { portId } = await params;

  if (hub_sso && (await tryEstablishSessionFromHubSso(hub_sso))) {
    redirect(`/ports/${portId}/access`);
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const portResult = await requireManagerPort(portId, session);
  if (portResult instanceof NextResponse) {
    notFound();
  }

  if (session.type === "port") {
    const pinConfigured = await authStore.hasAccessPin(session.authPortId);
    const pinUnlocked = await hasAccessPinUnlock(
      session.authPortId,
      session.movementsPortId
    );

    if (!pinUnlocked) {
      return (
        <AccessPinGate port={portResult} pinConfigured={pinConfigured} />
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex justify-end">
        <LogoutButton />
      </div>
      <AccessRegisterClient port={portResult} />
    </main>
  );
}
