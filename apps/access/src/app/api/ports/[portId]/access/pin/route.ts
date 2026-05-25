import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { requireManagerPort } from "@/lib/access-register";
import { authStore } from "@/lib/auth-store";
import { setAccessPinUnlockCookie } from "@/lib/access-pin-unlock";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ portId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withApiErrorHandling("POST /api/ports/[portId]/access/pin", async () => {
    const session = await getSession();
    if (!session || session.type !== "port") {
      return NextResponse.json({ error: "Port operator login required" }, { status: 401 });
    }

    const { portId } = await context.params;
    const portResult = await requireManagerPort(portId, session);
    if (portResult instanceof NextResponse) return portResult;

    const configured = await authStore.hasAccessPin(session.authPortId);
    if (!configured) {
      return NextResponse.json(
        { error: "Access PIN is not configured for this port" },
        { status: 503 }
      );
    }

    const body = (await parseJsonBody(request)) as { pin?: string };
    const pin = body.pin ?? "";

    const ok = await authStore.verifyAccessPin(session.authPortId, pin);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    await setAccessPinUnlockCookie({
      authPortId: session.authPortId,
      movementsPortId: session.movementsPortId,
    });

    return NextResponse.json({ ok: true });
  }, { fallback: PUBLIC_ERRORS.saveFailed });
}
