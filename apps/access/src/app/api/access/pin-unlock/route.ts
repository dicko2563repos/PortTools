import { NextResponse } from "next/server";
import { clearAccessPinUnlockCookie } from "@/lib/access-pin-unlock";

export async function DELETE() {
  await clearAccessPinUnlockCookie();
  return NextResponse.json({ ok: true });
}
