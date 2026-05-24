import { NextResponse } from "next/server";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authStore } from "@/lib/auth-store";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";
import { resolvePortIdsByCode } from "@/lib/resolve-port-ids";
import { setSessionCookie } from "@/lib/session";

const MAX_PASSWORD_LEN = 128;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/login", async () => {
    const rateLimited = await enforceLoginRateLimit(request);
    if (rateLimited) return rateLimited;

    const body = (await parseJsonBody(request)) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!EMAIL_RE.test(email) || password.length === 0 || password.length > MAX_PASSWORD_LEN) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const portLogin = await authStore.verifyPortLoginByEmail(email, password);
    if (portLogin) {
      const portIds = await resolvePortIdsByCode(portLogin.code);
      if (!portIds) {
        return NextResponse.json(
          { error: "Port is not fully configured. Contact an administrator." },
          { status: 503 }
        );
      }

      await setSessionCookie({
        type: "port",
        authPortId: portLogin.authPortId,
        portCode: portLogin.code,
        email: portLogin.email,
        publicPortId: portIds.publicPortId,
        movementsPortId: portIds.movementsPortId,
      });

      return NextResponse.json({
        type: "port",
        portCode: portLogin.code,
      });
    }

    const reportsLogin = await authStore.verifyReportsLogin(email, password);
    if (reportsLogin) {
      await setSessionCookie({
        type: "reports",
        reportsUserId: reportsLogin.reportsUserId,
        email: reportsLogin.email,
      });
      return NextResponse.json({ type: "reports" });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  });
}
