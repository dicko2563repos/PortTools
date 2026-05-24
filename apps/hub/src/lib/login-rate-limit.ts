import { NextResponse } from "next/server";
import { checkLoginRateLimit, clientIpFromRequest } from "@porttools/auth";

export async function enforceLoginRateLimit(
  request: Request
): Promise<NextResponse | null> {
  const ip = clientIpFromRequest(request);
  const result = await checkLoginRateLimit(request, "operator", ip);
  if (!result.limited) return null;

  return NextResponse.json(
    { error: "Too many login attempts. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    }
  );
}
