import { NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LEN = 128;

export async function GET() {
  return withApiErrorHandling("GET /api/admin/reports-users", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const users = await prisma.reportsUser.findMany({
      orderBy: { email: "asc" },
      select: { id: true, email: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      })),
    });
  });
}

export async function POST(request: Request) {
  return withApiErrorHandling(
    "POST /api/admin/reports-users",
    async () => {
      const session = await getSession();
      if (!session || session.type !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 401 });
      }

      const body = (await parseJsonBody(request)) as {
        email?: string;
        password?: string;
      };

      const email = body.email?.trim().toLowerCase() ?? "";
      const password = body.password ?? "";

      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      }
      if (password.length < 8 || password.length > MAX_PASSWORD_LEN) {
        return NextResponse.json(
          { error: "Password must be 8–128 characters" },
          { status: 400 }
        );
      }

      const existing = await prisma.reportsUser.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      const user = await authStore.createReportsUser({ email, password });
      const created = await prisma.reportsUser.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, isActive: true, createdAt: true },
      });

      return NextResponse.json(
        {
          user: created
            ? { ...created, createdAt: created.createdAt.toISOString() }
            : null,
        },
        { status: 201 }
      );
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
