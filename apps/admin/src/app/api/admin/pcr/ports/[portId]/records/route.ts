import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ portId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { portId } = await context.params;
  const port = await prisma.port.findUnique({
    where: { id: portId },
    select: { id: true, code: true, name: true },
  });
  if (!port) {
    return NextResponse.json({ error: "Port not found" }, { status: 404 });
  }

  const records = await prisma.complianceRecord.findMany({
    where: { portId },
    orderBy: { year: "desc" },
    include: {
      templateVersion: { select: { version: true, name: true } },
    },
  });

  return NextResponse.json({
    port,
    records: records.map((r) => ({
      id: r.id,
      year: r.year,
      templateVersion: r.templateVersion,
    })),
  });
}
