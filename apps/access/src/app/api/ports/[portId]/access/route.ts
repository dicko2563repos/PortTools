import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import {
  loadAccessRegisterSnapshot,
  requireManagerSession,
  requireManagerPort,
} from "@/lib/access-register";

type RouteContext = { params: Promise<{ portId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withApiErrorHandling("GET /api/admin/ports/[portId]/access", async () => {
    const manager = await requireManagerSession();
    if (manager instanceof NextResponse) return manager;

    const { portId } = await context.params;
    const portResult = await requireManagerPort(portId, manager);
    if (portResult instanceof NextResponse) return portResult;

    const snapshot = await loadAccessRegisterSnapshot(portId);
    return NextResponse.json({ port: portResult, ...snapshot });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}
