import { NextResponse } from "next/server";
import { PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  return withApiErrorHandling("GET /api/admin/auth-ports", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const ports = await prisma.authPort.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });

    return NextResponse.json({ ports });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}
