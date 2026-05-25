import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { requireManagerPort } from "@/lib/access-register";
import { authStore } from "@/lib/auth-store";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ portId: string }> };

async function resolveAuthPortId(portCode: string): Promise<string | null> {
  const authPort = await prisma.authPort.findUnique({
    where: { code: portCode },
    select: { id: true },
  });
  return authPort?.id ?? null;
}

export async function GET(_request: Request, context: RouteContext) {
  return withApiErrorHandling("GET /api/ports/[portId]/access/reminder-settings", async () => {
    const session = await getSession();
    if (!session || session.type !== "manager") {
      return NextResponse.json({ error: "Manager login required" }, { status: 401 });
    }

    const { portId } = await context.params;
    const portResult = await requireManagerPort(portId, session);
    if (portResult instanceof NextResponse) return portResult;

    const authPortId = await resolveAuthPortId(portResult.code);
    if (!authPortId) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    const settings = await authStore.getPortReminderSettings(authPortId);
    if (!settings) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    return NextResponse.json(settings);
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling("PATCH /api/ports/[portId]/access/reminder-settings", async () => {
    const session = await getSession();
    if (!session || session.type !== "manager") {
      return NextResponse.json({ error: "Manager login required" }, { status: 401 });
    }

    const { portId } = await context.params;
    const portResult = await requireManagerPort(portId, session);
    if (portResult instanceof NextResponse) return portResult;

    const authPortId = await resolveAuthPortId(portResult.code);
    if (!authPortId) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    const body = (await parseJsonBody(request)) as {
      complianceReminderEmailsEnabled?: boolean;
      asicReminderEmailsEnabled?: boolean;
    };

    const patch: {
      complianceReminderEmailsEnabled?: boolean;
      asicReminderEmailsEnabled?: boolean;
    } = {};

    if (body.complianceReminderEmailsEnabled !== undefined) {
      if (typeof body.complianceReminderEmailsEnabled !== "boolean") {
        return NextResponse.json({ error: "Invalid compliance reminder flag" }, { status: 400 });
      }
      patch.complianceReminderEmailsEnabled = body.complianceReminderEmailsEnabled;
    }

    if (body.asicReminderEmailsEnabled !== undefined) {
      if (typeof body.asicReminderEmailsEnabled !== "boolean") {
        return NextResponse.json({ error: "Invalid ASIC reminder flag" }, { status: 400 });
      }
      patch.asicReminderEmailsEnabled = body.asicReminderEmailsEnabled;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const ok = await authStore.setPortReminderSettings(authPortId, patch);
    if (!ok) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    const settings = await authStore.getPortReminderSettings(authPortId);
    return NextResponse.json(settings);
  }, { fallback: PUBLIC_ERRORS.saveFailed });
}
