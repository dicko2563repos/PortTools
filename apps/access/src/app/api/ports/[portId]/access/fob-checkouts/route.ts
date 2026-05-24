import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { findOpenCheckoutForDevice, requireManagerSession, requireManagerPort } from "@/lib/access-register";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string }> };

export async function POST(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "POST /api/admin/ports/[portId]/access/fob-checkouts",
    async () => {
      const manager = await requireManagerSession();
      if (manager instanceof NextResponse) return manager;

      const { portId } = await context.params;
      const portResult = await requireManagerPort(portId, manager);
      if (portResult instanceof NextResponse) return portResult;

      const body = (await parseJsonBody(request)) as {
        fobDeviceId?: string;
        holderType?: "staff" | "visitor";
        staffAsicRecordId?: string;
        visitorName?: string;
        visitorOrganization?: string;
        reason?: string;
        notes?: string;
      };

      const fobDeviceId = body.fobDeviceId?.trim() ?? "";
      const holderType = body.holderType;
      const staffAsicRecordId = body.staffAsicRecordId?.trim() ?? "";
      const visitorName = body.visitorName?.trim() ?? "";
      const visitorOrganization = body.visitorOrganization?.trim() ?? "";
      const reason = body.reason?.trim() ?? "";
      const notes = body.notes?.trim() ?? "";

      if (!fobDeviceId) {
        return NextResponse.json({ error: "FOB is required" }, { status: 400 });
      }
      if (holderType !== "staff" && holderType !== "visitor") {
        return NextResponse.json({ error: "Holder type must be staff or visitor" }, { status: 400 });
      }

      const device = await prisma.fobDevice.findFirst({
        where: { id: fobDeviceId, portId, deletedAt: null },
      });
      if (!device) {
        return NextResponse.json({ error: "FOB not found" }, { status: 404 });
      }

      const openOnDevice = await findOpenCheckoutForDevice(fobDeviceId);
      if (openOnDevice) {
        return NextResponse.json({ error: "This FOB is already signed out" }, { status: 409 });
      }

      if (holderType === "staff") {
        if (!staffAsicRecordId) {
          return NextResponse.json({ error: "Staff member is required" }, { status: 400 });
        }

        const staff = await prisma.staffAsicRecord.findFirst({
          where: { id: staffAsicRecordId, portId },
        });
        if (!staff) {
          return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
        }

        const openForStaff = await prisma.fobCheckout.findFirst({
          where: { staffAsicRecordId, signedInAt: null },
        });
        if (openForStaff) {
          return NextResponse.json(
            { error: "This staff member already has a FOB signed out" },
            { status: 409 }
          );
        }

        const checkout = await prisma.fobCheckout.create({
          data: {
            fobDeviceId,
            portId,
            holderType: "staff",
            staffAsicRecordId,
            reason,
            notes,
          },
        });

        return NextResponse.json({ checkout: { id: checkout.id } }, { status: 201 });
      }

      if (!visitorName) {
        return NextResponse.json({ error: "Visitor name is required" }, { status: 400 });
      }
      if (!visitorOrganization) {
        return NextResponse.json({ error: "Visitor organization is required" }, { status: 400 });
      }
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for visitor checkouts" }, { status: 400 });
      }

      const checkout = await prisma.fobCheckout.create({
        data: {
          fobDeviceId,
          portId,
          holderType: "visitor",
          visitorName,
          visitorOrganization,
          reason,
          notes,
        },
      });

      return NextResponse.json({ checkout: { id: checkout.id } }, { status: 201 });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
