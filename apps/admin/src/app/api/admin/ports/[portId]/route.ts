import { NextResponse } from "next/server";
import { createAuthStore, type AuthStoreClient } from "@porttools/auth";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ portId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling("PATCH /api/admin/ports/[portId]", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const { portId } = await context.params;
    const body = (await parseJsonBody(request)) as {
      loginEmail?: string | null;
      remindersEnabled?: boolean;
      accessPin?: string;
    };

    const store = createAuthStore(prisma as unknown as AuthStoreClient);

    if (body.accessPin !== undefined) {
      const pin = body.accessPin.trim();
      if (!/^\d{4,8}$/.test(pin)) {
        return NextResponse.json(
          { error: "Access PIN must be 4–8 digits" },
          { status: 400 }
        );
      }
      const pinOk = await store.setAccessPin(portId, pin);
      if (!pinOk) {
        return NextResponse.json({ error: "Invalid access PIN" }, { status: 400 });
      }
    }

    try {
      await store.syncAuthPortMeta(portId, {
        ...(body.loginEmail !== undefined ? { loginEmail: body.loginEmail } : {}),
        ...(body.remindersEnabled !== undefined
          ? { remindersEnabled: body.remindersEnabled }
          : {}),
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_LOGIN_EMAIL") {
        return NextResponse.json({ error: "Invalid login email address" }, { status: 400 });
      }
      throw error;
    }

    const port = await prisma.authPort.findUnique({
      where: { id: portId },
      select: {
        id: true,
        code: true,
        name: true,
        loginEmail: true,
        remindersEnabled: true,
        isActive: true,
        accessPin: { select: { portId: true } },
      },
    });

    if (!port) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    const { accessPin, ...rest } = port;
    return NextResponse.json({ port: { ...rest, hasAccessPin: accessPin !== null } });
  }, { fallback: PUBLIC_ERRORS.saveFailed });
}
