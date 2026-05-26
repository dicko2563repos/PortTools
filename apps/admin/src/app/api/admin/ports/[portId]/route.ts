import { NextResponse } from "next/server";
import {
  createAuthStore,
  syncPortMetaEverywhere,
  type AuthStoreClient,
} from "@porttools/auth";
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
      name?: string;
      loginEmail?: string | null;
      isActive?: boolean;
      accessPin?: string;
      password?: string;
    };

    const existing = await prisma.authPort.findUnique({
      where: { id: portId },
      select: { id: true, code: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    const name = body.name !== undefined ? body.name.trim() : undefined;
    const password = body.password?.trim() ?? "";

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
    }
    if (password.length > 0 && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password is too long" }, { status: 400 });
    }

    if (body.accessPin !== undefined) {
      const pin = body.accessPin.trim();
      if (pin.length > 0 && !/^\d{4,8}$/.test(pin)) {
        return NextResponse.json(
          { error: "Access PIN must be 4–8 digits" },
          { status: 400 }
        );
      }
    }

    const hasMetaChange =
      name !== undefined ||
      body.loginEmail !== undefined ||
      body.isActive !== undefined ||
      password.length >= 8 ||
      (body.accessPin !== undefined && body.accessPin.trim().length > 0);

    if (!hasMetaChange) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const store = createAuthStore(tx as unknown as AuthStoreClient);

        if (body.accessPin !== undefined && body.accessPin.trim().length > 0) {
          const pinOk = await store.setAccessPin(portId, body.accessPin.trim());
          if (!pinOk) {
            throw new Error("INVALID_ACCESS_PIN");
          }
        }

        if (password.length >= 8) {
          await store.setPortPasswordByAuthPortId(portId, password);
        }

        const syncMeta =
          name !== undefined ||
          body.loginEmail !== undefined ||
          body.isActive !== undefined;

        if (syncMeta) {
          await store.syncAuthPortMeta(portId, {
            ...(name !== undefined ? { name } : {}),
            ...(body.loginEmail !== undefined ? { loginEmail: body.loginEmail } : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          });
        }

        if (name !== undefined || body.isActive !== undefined) {
          await syncPortMetaEverywhere(tx, {
            previousCode: existing.code,
            ...(name !== undefined ? { name } : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          });
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "INVALID_LOGIN_EMAIL") {
          return NextResponse.json({ error: "Invalid login email address" }, { status: 400 });
        }
        if (error.message === "INVALID_ACCESS_PIN") {
          return NextResponse.json({ error: "Invalid access PIN" }, { status: 400 });
        }
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
