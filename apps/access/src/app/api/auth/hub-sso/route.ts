import { NextResponse } from "next/server";
import { safeReturnPath, verifyHubIframeSsoToken } from "@porttools/auth";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hubSso = url.searchParams.get("hub_sso");
  const returnPath = safeReturnPath(url.searchParams.get("return"), "/ports");

  if (!hubSso) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const operator = await verifyHubIframeSsoToken(hubSso);
  if (!operator || operator.type !== "port") {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const sessionToken = await createSessionToken({
    type: "port",
    authPortId: operator.authPortId,
    movementsPortId: operator.movementsPortId,
    portCode: operator.portCode,
    email: operator.email,
  });

  const response = NextResponse.redirect(new URL(returnPath, url.origin));
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  return response;
}
