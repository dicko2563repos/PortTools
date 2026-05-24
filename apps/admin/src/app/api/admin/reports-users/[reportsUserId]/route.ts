import { NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

type RouteContext = { params: Promise<{ reportsUserId: string }> };

const MAX_PASSWORD_LEN = 128;

export async function PATCH(request: Request, context: RouteContext) {
  return withApiErrorHandling(
    "PATCH /api/admin/reports-users/[reportsUserId]",
    async () => {
      const session = await getSession();
      if (!session || session.type !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 401 });
      }

      const { reportsUserId } = await context.params;
      const body = (await parseJsonBody(request)) as {
        password?: string;
        isActive?: boolean;
      };

      const user = await prisma.reportsUser.findUnique({ where: { id: reportsUserId } });
      if (!user) {
        return NextResponse.json({ error: "Reports user not found" }, { status: 404 });
      }

      const password = body.password?.trim() ?? "";
      const isActive = body.isActive;

      if (password.length === 0 && isActive === undefined) {
        return NextResponse.json({ error: "No changes provided" }, { status: 400 });
      }
      if (password.length > 0 && (password.length < 8 || password.length > MAX_PASSWORD_LEN)) {
        return NextResponse.json(
          { error: "Password must be 8–128 characters" },
          { status: 400 }
        );
      }

      if (password.length >= 8) {
        await authStore.setReportsUserPassword(reportsUserId, password);
      }
      if (isActive !== undefined) {
        await authStore.setReportsUserActive(reportsUserId, isActive);
      }

      const updated = await prisma.reportsUser.findUnique({
        where: { id: reportsUserId },
        select: { id: true, email: true, isActive: true, createdAt: true },
      });

      return NextResponse.json({
        user: updated
          ? { ...updated, createdAt: updated.createdAt.toISOString() }
          : null,
      });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
