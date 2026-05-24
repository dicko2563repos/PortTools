import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { loadFobDeviceHistory, requireManagerSession, requireManagerPort } from "@/lib/access-register";

type RouteContext = { params: Promise<{ portId: string; deviceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "GET /api/admin/ports/[portId]/access/fob-devices/[deviceId]/history",
    async () => {
      const manager = await requireManagerSession();
      if (manager instanceof NextResponse) return manager;

      const { portId, deviceId } = await context.params;
      const portResult = await requireManagerPort(portId, manager);
      if (portResult instanceof NextResponse) return portResult;

      const timeline = await loadFobDeviceHistory(portId, deviceId);
      if (!timeline) {
        return NextResponse.json({ error: "FOB not found" }, { status: 404 });
      }

      return NextResponse.json({ timeline });
    },
    { fallback: PUBLIC_ERRORS.loadFailed }
  );
}
