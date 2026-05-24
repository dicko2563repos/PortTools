import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { listManagerPorts, requireManagerSession } from "@/lib/access-register";

export async function GET() {
  return withApiErrorHandling("GET /api/ports", async () => {
    const manager = await requireManagerSession();
    if (manager instanceof NextResponse) return manager;

    const ports = await listManagerPorts(manager);
    return NextResponse.json({ ports });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}
