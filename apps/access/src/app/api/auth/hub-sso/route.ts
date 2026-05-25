import { NextResponse } from "next/server";
import { safeReturnPath, verifyHubIframeSsoToken } from "@porttools/auth";
import { createSessionToken, SESSION_COOKIE, type SessionPayload } from "@/lib/session";
import { setPorttoolsSessionCookie } from "@/lib/porttools-session";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

function accessSessionFromOperator(
  operator: NonNullable<Awaited<ReturnType<typeof verifyHubIframeSsoToken>>>
): SessionPayload | null {
  if (operator.type === "port") {
    return {
      type: "port",
      authPortId: operator.authPortId,
      movementsPortId: operator.movementsPortId,
      portCode: operator.portCode,
      email: operator.email,
    };
  }
  if (operator.type === "manager") {
    return {
      type: "manager",
      managerId: operator.managerId,
      email: operator.email,
      authPortIds: operator.authPortIds,
    };
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hubSso = url.searchParams.get("hub_sso");
  const returnPath = safeReturnPath(url.searchParams.get("return"), "/ports");

  if (!hubSso) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const operator = await verifyHubIframeSsoToken(hubSso);
  if (!operator) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const accessSession = accessSessionFromOperator(operator);
  if (!accessSession) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  await setPorttoolsSessionCookie(operator);

  const sessionToken = await createSessionToken(accessSession);
  const response = NextResponse.redirect(new URL(returnPath, url.origin));
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  return response;
}
