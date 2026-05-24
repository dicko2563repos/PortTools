import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import {
  loadAccessRegisterSnapshot,
  requireAccessRegisterPort,
} from "@/lib/access-register";

type RouteContext = { params: Promise<{ portId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withApiErrorHandling("GET /api/admin/ports/[portId]/access", async () => {
    const { portId } = await context.params;
    const auth = await requireAccessRegisterPort(portId);
    if (auth instanceof NextResponse) return auth;
    const { port: portResult } = auth;

    const snapshot = await loadAccessRegisterSnapshot(portId);
    return NextResponse.json({ port: portResult, ...snapshot });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}
