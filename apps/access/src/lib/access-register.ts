import { NextResponse } from "next/server";
import type { FobDeviceEventType, FobHolderType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession, type SessionPayload } from "@/lib/session";
import {
  daysUntilAsicExpiry,
  formatAsicExpiryMonth,
  isAsicExpired,
  isAsicExpiringSoon,
} from "@/lib/asic-expiry";

export const ASIC_EXPIRY_SOON_DAYS = 90;

type ManagerSession = SessionPayload;
type PortInfo = { id: string; code: string; name: string };

export async function requireManagerSession(): Promise<ManagerSession | NextResponse> {
  const session = await getSession();
  if (!session || session.type !== "manager") {
    return NextResponse.json({ error: "Manager login required" }, { status: 401 });
  }
  return session;
}

export async function resolveMovementsPort(portId: string): Promise<PortInfo | NextResponse> {
  const port = await prisma.port.findUnique({
    where: { id: portId },
    select: { id: true, code: true, name: true },
  });
  if (!port) {
    return NextResponse.json({ error: "Port not found" }, { status: 404 });
  }
  return port;
}

export async function requireManagerPort(
  portId: string,
  session: ManagerSession
): Promise<PortInfo | NextResponse> {
  const portResult = await resolveMovementsPort(portId);
  if (portResult instanceof NextResponse) return portResult;

  const authPort = await prisma.authPort.findUnique({
    where: { code: portResult.code },
    select: { id: true },
  });
  if (!authPort || !session.authPortIds.includes(authPort.id)) {
    return NextResponse.json({ error: "You do not have access to this port" }, { status: 403 });
  }

  return portResult;
}

export async function listManagerPorts(session: ManagerSession) {
  const authPorts = await prisma.authPort.findMany({
    where: { id: { in: session.authPortIds }, isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const movementsPorts = await prisma.port.findMany({
    where: { code: { in: authPorts.map((p) => p.code) }, isActive: true },
    select: { id: true, code: true, name: true },
  });

  const byCode = new Map(movementsPorts.map((p) => [p.code, p]));

  return authPorts
    .map((authPort) => {
      const movementsPort = byCode.get(authPort.code);
      if (!movementsPort) return null;
      return {
        authPortId: authPort.id,
        movementsPortId: movementsPort.id,
        code: movementsPort.code,
        name: movementsPort.name,
      };
    })
    .filter(Boolean);
}

export {
  asicExpiryToMonthInputValue,
  formatAsicExpiryMonth,
  parseAsicExpiryMonth,
} from "@/lib/asic-expiry";

export function parseDateOnly(raw: string): Date | null {
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysUntilExpiry(expiryDate: Date): number {
  return daysUntilAsicExpiry(expiryDate);
}

export function isExpiringSoon(expiryDate: Date): boolean {
  return isAsicExpiringSoon(expiryDate, ASIC_EXPIRY_SOON_DAYS);
}

export function isExpired(expiryDate: Date): boolean {
  return isAsicExpired(expiryDate);
}

const openCheckoutSelect = {
  id: true,
  holderType: true,
  visitorName: true,
  reason: true,
  notes: true,
  signedOutAt: true,
  staffAsic: {
    select: { id: true, name: true, asicNumber: true },
  },
} as const;

export async function loadAccessRegisterSnapshot(portId: string) {
  const [staffAsicRecords, activeFobDevices, deletedFobDevices] = await Promise.all([
    prisma.staffAsicRecord.findMany({
      where: { portId },
      orderBy: [{ expiryDate: "asc" }, { name: "asc" }],
    }),
    prisma.fobDevice.findMany({
      where: { portId, deletedAt: null },
      orderBy: { label: "asc" },
      include: {
        checkouts: {
          where: { signedInAt: null },
          take: 1,
          select: openCheckoutSelect,
        },
      },
    }),
    prisma.fobDevice.findMany({
      where: { portId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        label: true,
        notes: true,
        deletedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const staffOpenCheckouts = await prisma.fobCheckout.findMany({
    where: { portId, signedInAt: null, holderType: "staff" },
    select: {
      id: true,
      staffAsicRecordId: true,
      fobDevice: { select: { id: true, label: true } },
    },
  });

  const fobByStaffId = new Map(
    staffOpenCheckouts
      .filter((c) => c.staffAsicRecordId)
      .map((c) => [c.staffAsicRecordId!, c.fobDevice])
  );

  return {
    staffAsicRecords: staffAsicRecords.map((r) => ({
      id: r.id,
      name: r.name,
      asicNumber: r.asicNumber,
      expiryDate: formatAsicExpiryMonth(r.expiryDate),
      notes: r.notes,
      daysUntilExpiry: daysUntilExpiry(r.expiryDate),
      expiringSoon: isExpiringSoon(r.expiryDate),
      expired: isExpired(r.expiryDate),
      currentFob: fobByStaffId.get(r.id) ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    fobDevices: activeFobDevices.map((d) => ({
      id: d.id,
      label: d.label,
      notes: d.notes,
      openCheckout: d.checkouts[0]
        ? {
            id: d.checkouts[0].id,
            holderType: d.checkouts[0].holderType,
            visitorName: d.checkouts[0].visitorName,
            reason: d.checkouts[0].reason,
            notes: d.checkouts[0].notes,
            signedOutAt: d.checkouts[0].signedOutAt.toISOString(),
            staffAsic: d.checkouts[0].staffAsic,
          }
        : null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    deletedFobDevices: deletedFobDevices.map((d) => ({
      id: d.id,
      label: d.label,
      notes: d.notes,
      deletedAt: d.deletedAt!.toISOString(),
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export type FobTimelineEntry =
  | {
      kind: "checkout";
      id: string;
      at: string;
      holderType: FobHolderType;
      visitorName: string;
      reason: string;
      notes: string;
      signedOutAt: string;
      signedInAt: string | null;
      staffAsic: { id: string; name: string; asicNumber: string } | null;
    }
  | {
      kind: FobDeviceEventType;
      id: string;
      at: string;
      oldLabel: string | null;
      newLabel: string | null;
      notes: string;
      adminEmail: string;
    };

export async function loadFobDeviceHistory(
  portId: string,
  fobDeviceId: string
): Promise<FobTimelineEntry[] | null> {
  const device = await prisma.fobDevice.findFirst({
    where: { id: fobDeviceId, portId },
    select: { id: true },
  });
  if (!device) return null;

  const [checkouts, events] = await Promise.all([
    prisma.fobCheckout.findMany({
      where: { fobDeviceId },
      orderBy: { signedOutAt: "desc" },
      include: {
        staffAsic: { select: { id: true, name: true, asicNumber: true } },
      },
    }),
    prisma.fobDeviceEvent.findMany({
      where: { fobDeviceId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const timeline: FobTimelineEntry[] = [
    ...checkouts.map((c) => ({
      kind: "checkout" as const,
      id: c.id,
      at: c.signedOutAt.toISOString(),
      holderType: c.holderType,
      visitorName: c.visitorName,
      reason: c.reason,
      notes: c.notes,
      signedOutAt: c.signedOutAt.toISOString(),
      signedInAt: c.signedInAt?.toISOString() ?? null,
      staffAsic: c.staffAsic,
    })),
    ...events.map((e) => ({
      kind: e.eventType,
      id: e.id,
      at: e.createdAt.toISOString(),
      oldLabel: e.oldLabel,
      newLabel: e.newLabel,
      notes: e.notes,
      adminEmail: e.adminEmail,
    })),
  ];

  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return timeline;
}

export async function findOpenCheckoutForDevice(fobDeviceId: string) {
  return prisma.fobCheckout.findFirst({
    where: { fobDeviceId, signedInAt: null },
  });
}
