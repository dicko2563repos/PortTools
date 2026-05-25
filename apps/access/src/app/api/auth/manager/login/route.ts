import { NextResponse } from "next/server";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authenticateManager } from "@/lib/auth";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";
import { setSessionCookie } from "@/lib/session";

const MAX_PASSWORD_LEN = 128;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @deprecated Prefer POST /api/auth/login (unified). Kept for direct API callers. */
export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/manager/login", async () => {
    const rateLimited = await enforceLoginRateLimit(request, "manager");
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

    const session = await authenticateManager(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSessionCookie(session);
    return NextResponse.json({
      type: "manager",
      email: session.email,
      portCount: session.authPortIds.length,
    });
  });
}
