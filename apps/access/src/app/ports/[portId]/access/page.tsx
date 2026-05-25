import { NextResponse } from "next/server";
import { redirect, notFound } from "next/navigation";
import { ManagerReminderToggle } from "@porttools/ui";
import { AccessPinGate } from "@/components/AccessPinGate";
import { AccessRegisterClient } from "@/components/AccessRegisterClient";
import { LogoutButton } from "@/components/LogoutButton";
import { requireManagerPort } from "@/lib/access-register";
import { authStore } from "@/lib/auth-store";
import { hasAccessPinUnlock } from "@/lib/access-pin-unlock";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type PageProps = { params: Promise<{ portId: string }> };

export default async function AccessRegisterPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { portId } = await params;
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

  const isManager = session.type === "manager";
  let asicReminderEnabled = false;
  let loginEmail: string | null = null;

  if (isManager) {
    const authPort = await prisma.authPort.findUnique({
      where: { code: portResult.code },
      select: { id: true },
    });
    if (authPort) {
      const settings = await authStore.getPortReminderSettings(authPort.id);
      if (settings) {
        asicReminderEnabled = settings.asicReminderEmailsEnabled;
        loginEmail = settings.loginEmail;
      }
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex justify-end">
        <LogoutButton />
      </div>
      {isManager && (
        <div className="mb-6">
          <ManagerReminderToggle
            label="ASIC expiry reminder emails"
            description="Email the port login address when staff ASIC cards are 7, 30, or 60 days from expiry."
            enabled={asicReminderEnabled}
            settingsUrl={`/api/ports/${portId}/access/reminder-settings`}
            field="asicReminderEmailsEnabled"
            loginEmail={loginEmail}
          />
        </div>
      )}
      <AccessRegisterClient port={portResult} />
    </main>
  );
}
