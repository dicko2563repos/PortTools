import { NextResponse } from "next/server";
import {
  createAuthStore,
  normalizePortCode,
  provisionPortEverywhere,
  type AuthStoreClient,
} from "@porttools/auth";
import { PUBLIC_ERRORS, parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  return withApiErrorHandling("GET /api/admin/ports", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const ports = await prisma.authPort.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        loginEmail: true,
        remindersEnabled: true,
        isActive: true,
      },
    });

    return NextResponse.json({ ports });
  }, { fallback: PUBLIC_ERRORS.loadFailed });
}

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/admin/ports", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const body = (await parseJsonBody(request)) as {
      code?: string;
      name?: string;
      loginEmail?: string;
      password?: string;
    };

    const code = body.code ? normalizePortCode(body.code) : "";
    const name = body.name?.trim() ?? "";
    const loginEmail = body.loginEmail?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!code || !name || !loginEmail || password.length < 8) {
      return NextResponse.json(
        { error: "Code, name, login email, and password (min 8 chars) required" },
        { status: 400 }
      );
    }

    const existingAuth = await prisma.authPort.findUnique({ where: { code } });
    if (existingAuth) {
      return NextResponse.json({ error: "Port code already exists" }, { status: 409 });
    }

    const port = await prisma.$transaction(async (tx) => {
      const store = createAuthStore(tx as unknown as AuthStoreClient);
      const provisioned = await provisionPortEverywhere(store, tx, {
        code,
        name,
        password,
        loginEmail,
      });
      if (!provisioned.ok) {
        throw new Error("WEAK_PASSWORD");
      }

      return tx.authPort.findUniqueOrThrow({
        where: { id: provisioned.authPortId },
        select: {
          id: true,
          code: true,
          name: true,
          loginEmail: true,
          remindersEnabled: true,
          isActive: true,
        },
      });
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message === "WEAK_PASSWORD") {
        return null;
      }
      if (error instanceof Error && error.message === "INVALID_LOGIN_EMAIL") {
        return "INVALID_LOGIN_EMAIL" as const;
      }
      throw error;
    });

    if (port === "INVALID_LOGIN_EMAIL") {
      return NextResponse.json({ error: "Invalid login email address" }, { status: 400 });
    }

    if (!port) {
      return NextResponse.json(
        { error: "Password must be 8–128 characters" },
        { status: 400 }
      );
    }

    return NextResponse.json({ port }, { status: 201 });
  }, { fallback: PUBLIC_ERRORS.saveFailed });
}
