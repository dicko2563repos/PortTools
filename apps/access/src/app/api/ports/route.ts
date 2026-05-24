import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { listManagerPorts, requireAccessSession } from "@/lib/access-register";

export async function GET() {
  return withApiErrorHandling("GET /api/ports", async () => {
    const session = await requireAccessSession();
    if (session instanceof NextResponse) return session;

    const ports = await listManagerPorts(session);
    return NextResponse.json({ ports });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}
