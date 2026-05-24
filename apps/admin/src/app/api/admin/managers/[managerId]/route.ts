import { NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const MAX_PASSWORD_LEN = 128;

type RouteContext = { params: Promise<{ managerId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "PATCH /api/admin/managers/[managerId]",
    async () => {
      const session = await getSession();
      if (!session || session.type !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 401 });
      }

      const { managerId } = await context.params;
      const body = (await parseJsonBody(request)) as {
        password?: string;
        isActive?: boolean;
        authPortIds?: string[];
      };

      const manager = await prisma.manager.findUnique({ where: { id: managerId } });
      if (!manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      if (body.isActive !== undefined) {
        await authStore.setManagerActive(managerId, body.isActive);
      }

      if (body.password !== undefined) {
        const password = body.password;
        if (password.length < 8 || password.length > MAX_PASSWORD_LEN) {
          return NextResponse.json(
            { error: "Password must be 8–128 characters" },
            { status: 400 }
          );
        }
        const result = await authStore.setManagerPassword(managerId, password);
        if (!result.ok) {
          return NextResponse.json({ error: "Manager not found" }, { status: 404 });
        }
      }

      if (body.authPortIds !== undefined) {
        const ok = await authStore.setManagerPorts(managerId, body.authPortIds);
        if (!ok) {
          return NextResponse.json({ error: "Select at least one port" }, { status: 400 });
        }
      }

      const updated = await prisma.manager.findUnique({
        where: { id: managerId },
        include: { portAccess: true },
      });

      return NextResponse.json({
        manager: {
          id: updated!.id,
          email: updated!.email,
          isActive: updated!.isActive,
          createdAt: updated!.createdAt.toISOString(),
          authPortIds: updated!.portAccess.map((row) => row.portId),
        },
      });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "DELETE /api/admin/managers/[managerId]",
    async () => {
      const session = await getSession();
      if (!session || session.type !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 401 });
      }

      const { managerId } = await context.params;
      const ok = await authStore.deleteManager(managerId);
      if (!ok) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
