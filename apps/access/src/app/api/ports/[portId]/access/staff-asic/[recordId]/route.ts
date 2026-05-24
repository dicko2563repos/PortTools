import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import {
  formatAsicExpiryMonth,
  parseAsicExpiryMonth,
  requireManagerSession,
  requireManagerPort,
} from "@/lib/access-register";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string; recordId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "PATCH /api/admin/ports/[portId]/access/staff-asic/[recordId]",
    async () => {
      const manager = await requireManagerSession();
      if (manager instanceof NextResponse) return manager;

      const { portId, recordId } = await context.params;
      const portResult = await requireManagerPort(portId, manager);
      if (portResult instanceof NextResponse) return portResult;

      const existing = await prisma.staffAsicRecord.findFirst({
        where: { id: recordId, portId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      const body = (await parseJsonBody(request)) as {
        name?: string;
        asicNumber?: string;
        expiryDate?: string;
        notes?: string;
      };

      const name = body.name !== undefined ? body.name.trim() : undefined;
      const asicNumber = body.asicNumber !== undefined ? body.asicNumber.trim() : undefined;
      const expiryDate =
        body.expiryDate !== undefined ? parseAsicExpiryMonth(body.expiryDate) : undefined;
      const notes = body.notes !== undefined ? body.notes.trim() : undefined;

      if (name !== undefined && !name) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      if (asicNumber !== undefined && !asicNumber) {
        return NextResponse.json({ error: "ASIC number cannot be empty" }, { status: 400 });
      }
      if (body.expiryDate !== undefined && expiryDate === null) {
        return NextResponse.json({ error: "Valid expiry month (MM/YY) is required" }, { status: 400 });
      }

      const record = await prisma.staffAsicRecord.update({
        where: { id: recordId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(asicNumber !== undefined ? { asicNumber } : {}),
          ...(expiryDate !== undefined && expiryDate !== null ? { expiryDate } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      return NextResponse.json({
        record: {
          id: record.id,
          name: record.name,
          asicNumber: record.asicNumber,
          expiryDate: formatAsicExpiryMonth(record.expiryDate),
          notes: record.notes,
        },
      });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "DELETE /api/admin/ports/[portId]/access/staff-asic/[recordId]",
    async () => {
      const manager = await requireManagerSession();
      if (manager instanceof NextResponse) return manager;

      const { portId, recordId } = await context.params;
      const portResult = await requireManagerPort(portId, manager);
      if (portResult instanceof NextResponse) return portResult;

      const existing = await prisma.staffAsicRecord.findFirst({
        where: { id: recordId, portId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }

      const openCheckout = await prisma.fobCheckout.findFirst({
        where: { staffAsicRecordId: recordId, signedInAt: null },
      });
      if (openCheckout) {
        return NextResponse.json(
          { error: "Return the staff member's FOB before deleting this record" },
          { status: 409 }
        );
      }

      await prisma.staffAsicRecord.delete({ where: { id: recordId } });
      return NextResponse.json({ ok: true });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
