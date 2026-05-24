import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { loadFobDeviceHistory, requireAccessRegisterPort } from "@/lib/access-register";

type RouteContext = { params: Promise<{ portId: string; deviceId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "GET /api/admin/ports/[portId]/access/fob-devices/[deviceId]/history",
    async () => {
      const { portId, deviceId } = await context.params;
      const auth = await requireAccessRegisterPort(portId);
      if (auth instanceof NextResponse) return auth;
      const { port: portResult } = auth;

      const timeline = await loadFobDeviceHistory(portId, deviceId);
      if (!timeline) {
        return NextResponse.json({ error: "FOB not found" }, { status: 404 });
      }

      return NextResponse.json({ timeline });
    },
    { fallback: PUBLIC_ERRORS.loadFailed }
  );
}
