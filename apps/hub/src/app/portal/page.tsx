import { redirect } from "next/navigation";
import { OperatorPortalClient } from "@/components/OperatorPortalClient";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function PortalPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  if (session.type === "reports") {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <OperatorPortalClient session={{ type: "reports", email: session.email }} />
      </main>
    );
  }

  const authPort = await prisma.authPort.findUnique({
    where: { id: session.authPortId },
    select: { name: true },
  });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <OperatorPortalClient
        session={{
          type: "port",
          portCode: session.portCode,
          portName: authPort?.name ?? session.portCode,
          movementsPortId: session.movementsPortId,
        }}
      />
    </main>
  );
}
