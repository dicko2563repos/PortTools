import { NextResponse } from "next/server";
import { clearAccessPinUnlockCookie } from "@/lib/access-pin-unlock";
import { clearPorttoolsSessionCookie } from "@/lib/porttools-session";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  await clearSessionCookie();
  await clearPorttoolsSessionCookie();
  await clearAccessPinUnlockCookie();
  return NextResponse.json({ ok: true });
}
