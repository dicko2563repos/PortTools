import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.inspectionTemplate.findMany({
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      name: true,
      isActive: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { cloneActive?: boolean; name?: string };
  if (body.cloneActive === false) {
    return NextResponse.json(
      { error: "Only cloneActive publish is supported from the admin console" },
      { status: 400 }
    );
  }

  const active = await prisma.inspectionTemplate.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  if (!active) {
    return NextResponse.json({ error: "No active template to clone" }, { status: 400 });
  }

  const latest = await prisma.inspectionTemplate.findFirst({
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  await prisma.inspectionTemplate.updateMany({ data: { isActive: false } });

  const template = await prisma.inspectionTemplate.create({
    data: {
      version: nextVersion,
      name: body.name?.trim() || `YCR v${nextVersion}`,
      definition: active.definition ?? {},
      isActive: true,
    },
    select: {
      id: true,
      version: true,
      name: true,
      isActive: true,
      publishedAt: true,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
