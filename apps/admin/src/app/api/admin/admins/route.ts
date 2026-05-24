import { NextResponse } from "next/server";
import { authStore } from "@/lib/auth-store";
import { parseJsonBody, PUBLIC_ERRORS, withApiErrorHandling } from "@/lib/api-error";
import { getSession } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LEN = 128;

export async function GET() {
  return withApiErrorHandling("GET /api/admin/admins", async () => {
    const session = await getSession();
    if (!session || session.type !== "admin") {
      return NextResponse.json({ error: "Admin required" }, { status: 401 });
    }

    const admins = await authStore.listAdmins();
    return NextResponse.json({ admins });
  });
}

export async function POST(request: Request) {
  return withApiErrorHandling(
    "POST /api/admin/admins",
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

      const result = await authStore.createAdmin({ email, password });
      if (!result.ok) {
        if (result.reason === "duplicate") {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
        return NextResponse.json(
          { error: "Password must be 8–128 characters" },
          { status: 400 }
        );
      }

      return NextResponse.json({ admin: result.admin }, { status: 201 });
    },
    { fallback: PUBLIC_ERRORS.saveFailed }
  );
}
