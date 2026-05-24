import { NextResponse } from "next/server";
import { clearAccessPinUnlockCookie } from "@/lib/access-pin-unlock";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  await clearSessionCookie();
  await clearAccessPinUnlockCookie();
  return NextResponse.json({ ok: true });
}
