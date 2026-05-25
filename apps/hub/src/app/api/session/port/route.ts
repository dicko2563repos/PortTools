import { NextResponse } from "next/server";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { unifiedLoginPortResolver } from "@/lib/unified-login-resolver";
import { getSession, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/session/port", async () => {
    const session = await getSession();
    if (!session || session.type !== "manager") {
      return NextResponse.json({ error: "Manager session required" }, { status: 401 });
    }

    const body = (await parseJsonBody(request)) as { authPortId?: string };
    const authPortId = body.authPortId?.trim() ?? "";
    if (!authPortId || !session.authPortIds.includes(authPortId)) {
      return NextResponse.json({ error: "Invalid port" }, { status: 400 });
    }

    const portIds = await unifiedLoginPortResolver.byAuthPortId(authPortId);
    if (!portIds) {
      return NextResponse.json({ error: "Port is not fully configured" }, { status: 503 });
    }

    await setSessionCookie({
      type: "manager",
      managerId: session.managerId,
      email: session.email,
      authPortIds: session.authPortIds,
      authPortId,
      portCode: portIds.code,
      publicPortId: portIds.publicPortId,
      movementsPortId: portIds.movementsPortId,
    });

    return NextResponse.json({
      authPortId,
      portCode: portIds.code,
      movementsPortId: portIds.movementsPortId,
    });
  });
}
