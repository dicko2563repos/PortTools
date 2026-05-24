import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import {
  formatAsicExpiryMonth,
  parseAsicExpiryMonth,
  requireManagerSession,
  requireManagerPort,
} from "@/lib/access-register";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "POST /api/admin/ports/[portId]/access/staff-asic",
    async () => {
      const manager = await requireManagerSession();
      if (manager instanceof NextResponse) return manager;

      const { portId } = await context.params;
      const portResult = await requireManagerPort(portId, manager);
      if (portResult instanceof NextResponse) return portResult;

      const body = (await parseJsonBody(request)) as {
        name?: string;
        asicNumber?: string;
        expiryDate?: string;
        notes?: string;
      };

      const name = body.name?.trim() ?? "";
      const asicNumber = body.asicNumber?.trim() ?? "";
      const expiryDate = body.expiryDate ? parseAsicExpiryMonth(body.expiryDate) : null;
      const notes = body.notes?.trim() ?? "";

      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      if (!asicNumber) {
        return NextResponse.json({ error: "ASIC number is required" }, { status: 400 });
      }
      if (!expiryDate) {
        return NextResponse.json({ error: "Valid expiry month (MM/YY) is required" }, { status: 400 });
      }

      const record = await prisma.staffAsicRecord.create({
        data: { portId, name, asicNumber, expiryDate, notes },
      });

      return NextResponse.json(
        {
          record: {
            id: record.id,
            name: record.name,
            asicNumber: record.asicNumber,
            expiryDate: formatAsicExpiryMonth(record.expiryDate),
            notes: record.notes,
          },
        },
        { status: 201 }
      );
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
