import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { requireManagerSession, requireManagerPort } from "@/lib/access-register";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "POST /api/admin/ports/[portId]/access/fob-devices",
    async () => {
      const manager = await requireManagerSession();
      if (manager instanceof NextResponse) return manager;

      const { portId } = await context.params;
      const portResult = await requireManagerPort(portId, manager);
      if (portResult instanceof NextResponse) return portResult;

      const body = (await parseJsonBody(request)) as { label?: string; notes?: string };
      const label = body.label?.trim() ?? "";
      const notes = body.notes?.trim() ?? "";

      if (!label) {
        return NextResponse.json({ error: "FOB label is required" }, { status: 400 });
      }

      const device = await prisma.fobDevice.create({
        data: { portId, label, notes },
      });

      return NextResponse.json(
        {
          device: {
            id: device.id,
            label: device.label,
            notes: device.notes,
          },
        },
        { status: 201 }
      );
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
