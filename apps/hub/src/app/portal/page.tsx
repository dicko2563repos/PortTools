import { createHubIframeSsoToken } from "@porttools/auth";
import { redirect } from "next/navigation";
import { OperatorPortalClient } from "@/components/OperatorPortalClient";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function PortalPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const hubSsoToken = await createHubIframeSsoToken(session);

  if (session.type === "reports") {
    return (
      <main className="flex min-h-screen flex-col p-4 sm:p-6">
        <OperatorPortalClient
          session={{ type: "reports", email: session.email }}
          hubSsoToken={hubSsoToken}
        />
      </main>
    );
  }

  const authPort = await prisma.authPort.findUnique({
    where: { id: session.authPortId },
    select: { name: true },
  });

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-6">
      <OperatorPortalClient
        session={{
          type: "port",
          portCode: session.portCode,
          portName: authPort?.name ?? session.portCode,
          movementsPortId: session.movementsPortId,
        }}
        hubSsoToken={hubSsoToken}
      />
    </main>
  );
}
