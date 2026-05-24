import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import {
  findOpenCheckoutForDevice,
  requireAccessRegisterPort,
} from "@/lib/access-register";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string; deviceId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "PATCH /api/admin/ports/[portId]/access/fob-devices/[deviceId]",
    async () => {
      const { portId, deviceId } = await context.params;
      const auth = await requireAccessRegisterPort(portId);
      if (auth instanceof NextResponse) return auth;
      const { port: portResult, session } = auth;

      const device = await prisma.fobDevice.findFirst({
        where: { id: deviceId, portId },
      });
      if (!device) {
        return NextResponse.json({ error: "FOB not found" }, { status: 404 });
      }

      const body = (await parseJsonBody(request)) as {
        label?: string;
        notes?: string;
        action?: "delete" | "restore";
      };

      const label = body.label !== undefined ? body.label.trim() : undefined;
      const notes = body.notes !== undefined ? body.notes.trim() : undefined;
      const action = body.action;

      if (action === "delete") {
        if (device.deletedAt) {
          return NextResponse.json({ error: "FOB is already deleted" }, { status: 409 });
        }
        const open = await findOpenCheckoutForDevice(deviceId);
        if (open) {
          return NextResponse.json(
            { error: "Return this FOB before deleting it" },
            { status: 409 }
          );
        }

        const updated = await prisma.$transaction(async (tx) => {
          const next = await tx.fobDevice.update({
            where: { id: deviceId },
            data: { deletedAt: new Date() },
          });
          await tx.fobDeviceEvent.create({
            data: {
              fobDeviceId: deviceId,
              portId,
              eventType: "deleted",
              oldLabel: device.label,
              adminEmail: session.email,
            },
          });
          return next;
        });

        return NextResponse.json({
          device: {
            id: updated.id,
            label: updated.label,
            deletedAt: updated.deletedAt!.toISOString(),
          },
        });
      }

      if (action === "restore") {
        if (!device.deletedAt) {
          return NextResponse.json({ error: "FOB is not deleted" }, { status: 409 });
        }

        const updated = await prisma.$transaction(async (tx) => {
          const next = await tx.fobDevice.update({
            where: { id: deviceId },
            data: { deletedAt: null },
          });
          await tx.fobDeviceEvent.create({
            data: {
              fobDeviceId: deviceId,
              portId,
              eventType: "restored",
              newLabel: device.label,
              adminEmail: session.email,
            },
          });
          return next;
        });

        return NextResponse.json({
          device: {
            id: updated.id,
            label: updated.label,
            deletedAt: null,
          },
        });
      }

      if (label !== undefined && !label) {
        return NextResponse.json({ error: "FOB label cannot be empty" }, { status: 400 });
      }

      if (label === undefined && notes === undefined) {
        return NextResponse.json({ error: "No changes provided" }, { status: 400 });
      }

      if (device.deletedAt && label !== undefined) {
        return NextResponse.json(
          { error: "Restore this FOB before renaming it" },
          { status: 409 }
        );
      }

      const labelChanged = label !== undefined && label !== device.label;

      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.fobDevice.update({
          where: { id: deviceId },
          data: {
            ...(label !== undefined ? { label } : {}),
            ...(notes !== undefined ? { notes } : {}),
          },
        });

        if (labelChanged) {
          await tx.fobDeviceEvent.create({
            data: {
              fobDeviceId: deviceId,
              portId,
              eventType: "renamed",
              oldLabel: device.label,
              newLabel: label,
              adminEmail: session.email,
            },
          });
        }

        return next;
      });

      return NextResponse.json({
        device: {
          id: updated.id,
          label: updated.label,
          notes: updated.notes,
        },
      });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
