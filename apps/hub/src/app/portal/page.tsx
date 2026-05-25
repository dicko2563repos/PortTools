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
