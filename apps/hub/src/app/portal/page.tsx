import { createHubIframeSsoToken, hubSsoBridgeUrl } from "@porttools/auth";
import { redirect } from "next/navigation";
import { OperatorPortalClient } from "@/components/OperatorPortalClient";
import {
  accessAppOrigin,
  pcrAppOrigin,
  pmsAppOrigin,
} from "@/lib/app-urls";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

async function loadManagerPortOptions(authPortIds: string[]) {
  const authPorts = await prisma.authPort.findMany({
    where: { id: { in: authPortIds }, isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const movementsPorts = await prisma.movementsPort.findMany({
    where: { code: { in: authPorts.map((port) => port.code) } },
    select: { id: true, code: true },
  });

  const movementsByCode = new Map(movementsPorts.map((port) => [port.code, port.id]));

  return authPorts
    .map((authPort) => {
      const movementsPortId = movementsByCode.get(authPort.code);
      if (!movementsPortId) return null;
      return {
        authPortId: authPort.id,
        movementsPortId,
        code: authPort.code,
        name: authPort.name,
      };
    })
    .filter((port): port is NonNullable<typeof port> => port !== null);
}

export default async function PortalPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const hubSsoToken = await createHubIframeSsoToken(session);

  if (session.type === "reports") {
    const iframeSrc = hubSsoBridgeUrl(pmsAppOrigin(), "/reports", hubSsoToken);
    return (
      <main className="flex min-h-screen flex-col p-4 sm:p-6">
        <OperatorPortalClient
          session={{ type: "reports", email: session.email }}
          iframeUrls={{ reports: iframeSrc }}
        />
      </main>
    );
  }

  if (session.type === "manager") {
    const ports = await loadManagerPortOptions(session.authPortIds);
    const activePort = ports.find((port) => port.authPortId === session.authPortId);
    const portName = activePort?.name ?? session.portCode;

    const accessPath = `/ports/${session.movementsPortId}/access`;

    return (
      <main className="flex min-h-screen flex-col p-4 sm:p-6">
        <OperatorPortalClient
          session={{
            type: "manager",
            email: session.email,
            authPortId: session.authPortId,
            portCode: session.portCode,
            portName,
            movementsPortId: session.movementsPortId,
            ports,
          }}
          iframeUrls={{
            compliance: hubSsoBridgeUrl(pcrAppOrigin(), "/port/record", hubSsoToken),
            movements: hubSsoBridgeUrl(pmsAppOrigin(), "/port/movements", hubSsoToken),
            access: hubSsoBridgeUrl(accessAppOrigin(), accessPath, hubSsoToken),
          }}
        />
      </main>
    );
  }

  const authPort = await prisma.authPort.findUnique({
    where: { id: session.authPortId },
    select: { name: true },
  });

  const accessPath = `/ports/${session.movementsPortId}/access`;

  return (
    <main className="flex min-h-screen flex-col p-4 sm:p-6">
      <OperatorPortalClient
        session={{
          type: "port",
          portCode: session.portCode,
          portName: authPort?.name ?? session.portCode,
          movementsPortId: session.movementsPortId,
        }}
        iframeUrls={{
          compliance: hubSsoBridgeUrl(pcrAppOrigin(), "/port/record", hubSsoToken),
          movements: hubSsoBridgeUrl(pmsAppOrigin(), "/port/movements", hubSsoToken),
          access: hubSsoBridgeUrl(accessAppOrigin(), accessPath, hubSsoToken),
        }}
      />
    </main>
  );
}
