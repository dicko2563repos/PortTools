import { NextResponse } from "next/server";
import { handleUnifiedLoginRequest } from "@porttools/auth";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authStore } from "@/lib/auth-store";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";
import { setPorttoolsSessionCookie } from "@/lib/porttools-session";
import { setSessionCookie, type SessionPayload } from "@/lib/session";
import { unifiedLoginPortResolver } from "@/lib/unified-login-resolver";

const PMS_APP_URL =
  process.env.NEXT_PUBLIC_PMS_APP_URL?.trim() || "https://pms.porttools.com.au";

function accessSessionFromLogin(
  login: Extract<
    Awaited<ReturnType<typeof handleUnifiedLoginRequest>>,
    { ok: true }
  >["login"]
): SessionPayload | null {
  if (login.kind === "port") {
    return {
      type: "port",
      authPortId: login.authPortId,
      movementsPortId: login.movementsPortId,
      portCode: login.portCode,
      email: login.email,
    };
  }
  if (login.kind === "manager") {
    return {
      type: "manager",
      managerId: login.managerId,
      email: login.email,
      authPortIds: login.authPortIds,
    };
  }
  return null;
}

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/login", async () => {
    const rateLimited = await enforceLoginRateLimit(request);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(request);
    const result = await handleUnifiedLoginRequest({
      body: body as {
        identifier?: string;
        password?: string;
        entryApp?: "access";
      },
      store: authStore,
      resolver: unifiedLoginPortResolver,
      defaultEntryApp: "access",
      redirectOptions: {
        pmsOrigin: new URL(PMS_APP_URL).origin,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await setPorttoolsSessionCookie(result.session);

    const accessSession = accessSessionFromLogin(result.login);
    if (accessSession) {
      await setSessionCookie(accessSession);
    }

    return NextResponse.json({
      type: result.type,
      redirect: result.redirect,
    });
  });
}
