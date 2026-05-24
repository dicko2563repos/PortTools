import { NextResponse } from "next/server";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authenticateAdmin } from "@/lib/auth";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";
import { setSessionCookie } from "@/lib/session";

const MAX_PASSWORD_LEN = 128;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/admin/login", async () => {
    const rateLimited = await enforceLoginRateLimit(request, "admin");
    if (rateLimited) return rateLimited;

    const body = (await parseJsonBody(request)) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (
      !EMAIL_RE.test(email) ||
      password.length === 0 ||
      password.length > MAX_PASSWORD_LEN
    ) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await authenticateAdmin(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { email: sessionEmail } = session;
    await setSessionCookie(session);
    return NextResponse.json({
      type: "admin",
      email: sessionEmail,
    });
  });
}
