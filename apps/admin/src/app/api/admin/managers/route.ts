import { NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LEN = 128;

export async function GET() {
  return withApiErrorHandling("GET /api/admin/managers", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const managers = await authStore.listManagers();
    return NextResponse.json({
      managers: managers.map((m) => ({
        id: m.id,
        email: m.email,
        isActive: m.isActive,
        createdAt: m.createdAt.toISOString(),
        authPortIds: m.authPortIds,
      })),
    });
  });
}

export async function POST(request: Request) {
  return withApiErrorHandling(
    "POST /api/admin/managers",
    async () => {
      const session = await getSession();
      if (!session || session.type !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 401 });
      }

      const body = (await parseJsonBody(request)) as {
        email?: string;
        password?: string;
        authPortIds?: string[];
      };

      const email = body.email?.trim().toLowerCase() ?? "";
      const password = body.password ?? "";
      const authPortIds = body.authPortIds ?? [];

      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      }
      if (password.length < 8 || password.length > MAX_PASSWORD_LEN) {
        return NextResponse.json(
          { error: "Password must be 8–128 characters" },
          { status: 400 }
        );
      }

      const result = await authStore.createManager({ email, password, authPortIds });
      if (!result.ok) {
        if (result.reason === "duplicate") {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
        if (result.reason === "no_ports") {
          return NextResponse.json({ error: "Select at least one port" }, { status: 400 });
        }
        return NextResponse.json(
          { error: "Password must be 8–128 characters" },
          { status: 400 }
        );
      }

      const created = await prisma.manager.findUnique({
        where: { id: result.manager.id },
        include: { portAccess: true },
      });

      return NextResponse.json(
        {
          manager: {
            id: created!.id,
            email: created!.email,
            isActive: created!.isActive,
            createdAt: created!.createdAt.toISOString(),
            authPortIds: created!.portAccess.map((row) => row.portId),
          },
        },
        { status: 201 }
      );
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
