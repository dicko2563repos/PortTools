import { NextResponse } from "next/server";
import { handleUnifiedLoginRequest } from "@porttools/auth";
import { parseJsonBody, withApiErrorHandling } from "@/lib/api-error";
import { authStore } from "@/lib/auth-store";
import { pmsAppOrigin } from "@/lib/app-urls";
import { enforceLoginRateLimit } from "@/lib/login-rate-limit";
import { setSessionCookie } from "@/lib/session";
import { unifiedLoginPortResolver } from "@/lib/unified-login-resolver";

export async function POST(request: Request) {
  return withApiErrorHandling("POST /api/auth/login", async () => {
    const rateLimited = await enforceLoginRateLimit(request);
    if (rateLimited) return rateLimited;

    const body = await parseJsonBody(request);
    const result = await handleUnifiedLoginRequest({
      body: body as { identifier?: string; password?: string; entryApp?: "hub" },
      store: authStore,
      resolver: unifiedLoginPortResolver,
      defaultEntryApp: "hub",
      redirectOptions: { pmsOrigin: pmsAppOrigin() },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await setSessionCookie(result.session);

    return NextResponse.json({
      type: result.type,
      redirect: result.redirect,
    });
  });
}
